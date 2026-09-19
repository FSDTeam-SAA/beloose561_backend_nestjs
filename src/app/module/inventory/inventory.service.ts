import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  buildProductQrTarget,
  generateAndUploadQrCode,
} from '../../helpers/qrcodeGenerator';
import { Humidor, HumidorDocument } from '../humidor/entities/humidor.entity';
import {
  MasterDatabase,
  MasterDatabaseDocument,
} from '../master-database/entities/master-database.entity';
import { NotifationService } from '../notifation/notifation.service';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { AddStaffPickDto } from './dto/add-staff-pick.dto';
import {
  BULK_INVENTORY_FIELDS,
  BulkInventoryMappingDto,
} from './dto/bulk-inventory-mapping.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { BulkInventoryValidateDto } from './dto/bulk-inventory.dto';
import { DiscountInventoryDto } from './dto/discount-inventory.dto';
import { FeatureInventoryDto, FeatureType } from './dto/feature-inventory.dto';
import {
  GuidedDiscoveryDto,
  NewOrFamiliarPreference,
} from './dto/guided-discovery.dto';
import { MarkNewArrivalDto } from './dto/mark-new-arrival.dto';
import { RecordSaleDto } from './dto/record-sale.dto';
import { SetDailyFeaturedDto } from './dto/set-daily-featured.dto';
import { UpdateDailyFeaturedDto } from './dto/update-daily-featured.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateNewArrivalDto } from './dto/update-new-arrival.dto';
import { UpdateStaffPickDto } from './dto/update-staff-pick.dto';
import { Inventory, InventoryDocument } from './entities/inventory.entity';

const OPPORTUNITY_DAYS = 90;
const SURPRISE_ME_MAX_TRIES = 5;

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private inventoryRepository: Model<InventoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,
    @InjectModel(MasterDatabase.name)
    private readonly masterDatabaseModel: Model<MasterDatabaseDocument>,
    @InjectModel(Humidor.name)
    private readonly humidorModel: Model<HumidorDocument>,
    private readonly notifationService: NotifationService,
  ) {}

  previewBulkInventory(
    file: Express.Multer.File,
    dto: BulkInventoryMappingDto,
  ) {
    if (!file?.buffer?.length) throw new HttpException('File is required', 400);
    if (!/\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      throw new HttpException('Upload a CSV, XLSX or XLS file', 400);
    }

    let workbook: XLSX.WorkBook;
    try {
      // raw preserves leading zeroes in CSV barcodes; formatted cells do so in Excel.
      workbook = XLSX.read(file.buffer, {
        type: 'buffer',
        raw: true,
        sheetRows: 2002,
      });
    } catch {
      throw new HttpException('Unable to read the inventory file', 400);
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new HttpException('No sheet found in uploaded file', 400);
    const range = XLSX.utils.decode_range(
      sheet['!fullref'] || sheet['!ref'] || 'A1',
    );
    if (range.e.r > 2000 || range.e.c > 99) {
      throw new HttpException(
        'File must contain at most 2000 data rows and 100 columns',
        400,
      );
    }
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });
    const headers = (rows.shift() || []).map((header) => String(header).trim());
    if (!headers.length || !rows.length) {
      throw new HttpException(
        'Uploaded file must contain headers and data rows',
        400,
      );
    }
    if (
      headers.some((header) => !header) ||
      new Set(headers).size !== headers.length
    ) {
      throw new HttpException(
        'Column headers must be non-empty and unique',
        400,
      );
    }

    const mapping = dto.mapping;
    if (mapping !== undefined) {
      if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
        throw new HttpException('Mapping must be a JSON object', 400);
      }
      const targets = Object.values(mapping);
      for (const [header, target] of Object.entries(mapping)) {
        if (!headers.includes(header))
          throw new HttpException(`Unknown column: ${header}`, 400);
        if (!BULK_INVENTORY_FIELDS.includes(target)) {
          throw new HttpException(
            `Unsupported inventory field: ${target as any}`,
            400,
          );
        }
      }
      if (new Set(targets).size !== targets.length) {
        throw new HttpException('Map each inventory field only once', 400);
      }
      if (
        !['upc', 'quantity', 'price'].every((field) =>
          targets.includes(field as (typeof targets)[number]),
        )
      ) {
        throw new HttpException(
          'Mapping must include upc, quantity and price',
          400,
        );
      }
    }

    const preview = rows
      .slice(0, 10)
      .map((row) =>
        Object.fromEntries(
          headers.map((header, index) => [header, row[index] ?? '']),
        ),
      );
    return {
      headers,
      totalRows: rows.length,
      preview,
      availableFields: BULK_INVENTORY_FIELDS,
      ...(mapping && {
        mapping,
        mappedRows: rows.map((row) =>
          Object.fromEntries(
            Object.entries(mapping).map(([header, field]) => [
              field,
              row[headers.indexOf(header)] ?? '',
            ]),
          ),
        ),
        mappedPreview: preview.map((row) =>
          Object.fromEntries(
            Object.entries(mapping).map(([header, field]) => [
              field,
              row[header],
            ]),
          ),
        ),
      }),
    };
  }

  private async prepareBulkInventory(
    userId: string,
    dto: BulkInventoryValidateDto,
  ) {
    if (!Array.isArray(dto.rows) || !dto.rows.length || dto.rows.length > 2000)
      throw new HttpException('Provide between 1 and 2000 rows', 400);
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const text = (value: unknown) =>
      typeof value === 'string' ? value.trim() : '';
    const number = (value: unknown) => {
      if (typeof value === 'number') return value;
      if (
        typeof value !== 'string' ||
        !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())
      )
        return NaN;
      return Number(value.trim());
    };
    const [masters, humidors, existing] = await Promise.all([
      this.masterDatabaseModel
        .find({
          upcCodes: { $in: dto.rows.map((r) => text(r?.upc)).filter(Boolean) },
          status: 'active',
        })
        .lean(),
      this.humidorModel
        .find({ userId: user._id, retailerId: retailer._id, isActive: true })
        .lean(),
      this.inventoryRepository
        .find({ retailerId: retailer._id })
        .select(
          'masterCigarId humidorId wallId shelfId shelfName shelfRow shelfColumn',
        )
        .lean(),
    ]);
    const errors: { row: number; upc: string; reason: string }[] = [];
    const masterByUpc = new Map<string, typeof masters>();
    for (const master of masters) {
      for (const upc of new Set(master.upcCodes)) {
        masterByUpc.set(upc, [...(masterByUpc.get(upc) ?? []), master]);
      }
    }
    const prepared: {
      row: number;
      upc: string;
      filter: Record<string, unknown>;
      values: Record<string, unknown>;
    }[] = [];
    const cells = new Set<string>();
    for (const [index, input] of dto.rows.entries()) {
      const upc = text(input?.upc);
      try {
        if (!input || typeof input !== 'object' || Array.isArray(input))
          throw new Error('Row must be an object');
        if (!upc) throw new Error('UPC is required and must be a string');
        const matches = masterByUpc.get(upc) ?? [];
        if (matches.length !== 1)
          throw new Error(
            matches.length
              ? 'UPC matches multiple master cigars'
              : 'UPC not found in Master Database',
          );
        const master = matches[0];
        const quantity = number(input.quantity),
          price = number(input.price),
          pricePerBox = number(input.pricePerBox);
        if (!Number.isSafeInteger(quantity) || quantity < 0)
          throw new Error('Quantity must be a non-negative integer');
        if (!Number.isFinite(price) || price < 0)
          throw new Error('Price must be a non-negative number');
        if (!Number.isFinite(pricePerBox) || pricePerBox < 0)
          throw new Error('Price per box must be a non-negative number');
        const rooms = humidors.filter((h) => h.name === text(input.humidor));
        if (rooms.length !== 1)
          throw new Error('Humidor not found or name is ambiguous');
        const humidor = rooms[0];
        const column = number(input.shelfColumn ?? input.column);
        if (!Number.isSafeInteger(column) || column < 1)
          throw new Error('Column must be a positive integer');
        if (
          input.shelfColumn !== undefined &&
          input.column !== undefined &&
          number(input.column) !== column
        )
          throw new Error('Conflicting column values');
        const location: Record<string, unknown> = {
          humidorId: humidor._id,
          shelfColumn: column,
        };
        if (text(input.wall)) {
          const walls =
            humidor.walls?.filter((w) => w.name === text(input.wall)) ?? [];
          if (walls.length !== 1)
            throw new Error('Wall not found or name is ambiguous');
          const wall = walls[0];
          const shelves = wall.shelves.filter(
            (sh) => sh.name === text(input.shelf),
          );
          if (shelves.length !== 1)
            throw new Error('Shelf not found in wall or name is ambiguous');
          if (column > wall.columns)
            throw new Error('Column exceeds wall columns');
          Object.assign(location, {
            wallId: wall._id,
            wallName: wall.name,
            shelfId: shelves[0]._id,
            shelfName: shelves[0].name,
          });
        } else {
          const shelves =
            humidor.shelfes?.filter((sh) => sh.name === text(input.shelf)) ??
            [];
          if (shelves.length !== 1)
            throw new Error('Choose a valid wall and shelf, or a legacy shelf');
          const row = number(input.shelfRow ?? input.row);
          if (!Number.isSafeInteger(row) || row < 1)
            throw new Error(
              'Row must be a positive integer for legacy shelves',
            );
          if (
            input.shelfRow !== undefined &&
            input.row !== undefined &&
            number(input.row) !== row
          )
            throw new Error('Conflicting row values');
          this.validateShelfPosition(shelves[0], row, column);
          Object.assign(location, {
            shelfName: shelves[0].name,
            shelfRow: row,
          });
        }
        const filter = {
          retailerId: retailer._id,
          masterCigarId: master._id,
          humidorId: humidor._id,
          shelfColumn: column,
          ...(location.wallId
            ? { wallId: location.wallId, shelfId: location.shelfId }
            : {
                wallId: null,
                shelfName: location.shelfName,
                shelfRow: location.shelfRow,
              }),
        };
        const key = JSON.stringify([
          String(humidor._id),
          String(location.wallId ?? ''),
          String(location.shelfId ?? location.shelfName),
          location.shelfRow,
          column,
        ]);
        if (cells.has(key))
          throw new Error('Duplicate shelf cell in this batch');
        const occupants = existing.filter(
          (item) =>
            String(item.humidorId) === String(humidor._id) &&
            item.shelfColumn === column &&
            (location.wallId
              ? String(item.wallId) === String(location.wallId) &&
                String(item.shelfId) === String(location.shelfId)
              : !item.wallId &&
                item.shelfName === location.shelfName &&
                item.shelfRow === location.shelfRow),
        );
        if (
          occupants.length > 1 ||
          occupants.some(
            (item) => String(item.masterCigarId) !== String(master._id),
          )
        )
          throw new Error('Shelf cell is already occupied');
        cells.add(key);
        prepared.push({
          row: index + 1,
          upc,
          filter,
          values: {
            ...location,
            userId: user._id,
            retailerId: retailer._id,
            masterCigarId: master._id,
            quantity,
            price,
            pricePerBox,
            status: quantity > 0 ? 'active' : 'out_of_stock',
            name: master.name || master.productLine,
            productLine: master.productLine,
            brand: master.brand,
            wrapper: master.wrapper,
            size: master.size,
            image: master.image,
            description: master.description,
            strength: this.normalizeMasterStrength(master.strength),
            smokingTime: this.normalizeMasterSmokingTime(
              master.estimatedSmokingTime,
            ),
            pairingSuggestions: master.pairingSuggestions,
          },
        });
      } catch (error) {
        errors.push({
          row: index + 1,
          upc,
          reason: error instanceof Error ? error.message : 'Invalid row',
        });
      }
    }
    return { prepared, errors, total: dto.rows.length };
  }

  async validateBulkInventory(userId: string, dto: BulkInventoryValidateDto) {
    const { prepared, errors, total } = await this.prepareBulkInventory(
      userId,
      dto,
    );
    return { total, valid: prepared.length, invalid: errors.length, errors };
  }

  async importBulkInventory(userId: string, dto: BulkInventoryValidateDto) {
    const { prepared, errors, total } = await this.prepareBulkInventory(
      userId,
      dto,
    );
    let imported = 0;
    if (prepared.length) {
      try {
        const result = await this.inventoryRepository.bulkWrite(
          prepared.map((item) => ({
            updateOne: {
              filter: item.filter,
              update: { $set: item.values },
              upsert: true,
            },
          })),
          { ordered: false },
        );
        imported = result.matchedCount + result.upsertedCount;
      } catch (error) {
        // Only report confirmed row failures. Network/write-concern failures propagate.
        if (
          !(error instanceof mongoose.mongo.MongoBulkWriteError) ||
          error.result.getWriteConcernError()
        )
          throw error;
        const writeErrors = error.result.getWriteErrors();
        if (!writeErrors.length) throw error;
        imported = error.result.matchedCount + error.result.upsertedCount;
        for (const failure of writeErrors) {
          const item = prepared[failure.index];
          errors.push({
            row: item.row,
            upc: item.upc,
            reason: 'Database rejected this inventory row',
          });
        }
      }
      if (imported)
        await this.userModel.findByIdAndUpdate(userId, {
          $set: { isInventory: true },
        });
    }
    return {
      total,
      imported,
      failed: errors.length,
      errors: errors.sort((a, b) => a.row - b.row),
    };
  }

  private validateShelfPosition(
    shelf: { rows?: number; columns?: number },
    row: number,
    column: number,
  ) {
    if (!shelf.rows || !shelf.columns) {
      throw new HttpException(
        'Configure rows and columns for the selected shelf first',
        400,
      );
    }
    if (row > shelf.rows || column > shelf.columns) {
      throw new HttpException(
        `Position must be within the shelf grid (${shelf.rows} rows × ${shelf.columns} columns)`,
        400,
      );
    }
  }

  private async ensureShelfCellAvailable(
    retailerId: mongoose.Types.ObjectId,
    humidorId: mongoose.Types.ObjectId,
    shelfName: string,
    shelfRow: number | undefined,
    shelfColumn: number,
    excludeInventoryId?: string,
    wallId?: mongoose.Types.ObjectId,
    shelfId?: mongoose.Types.ObjectId,
  ) {
    const occupied = await this.inventoryRepository.exists({
      retailerId,
      humidorId,
      shelfColumn,
      ...(wallId && shelfId ? { wallId, shelfId } : { shelfName, shelfRow }),
      ...(excludeInventoryId
        ? { _id: { $ne: new mongoose.Types.ObjectId(excludeInventoryId) } }
        : {}),
    });
    if (occupied) {
      throw new HttpException(
        `${wallId ? 'This shelf' : `Row ${shelfRow}`}, column ${shelfColumn} is already occupied`,
        409,
      );
    }
  }

  async createInventory(
    userId: string,
    createInventoryDto: CreateInventoryDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const humidor = await this.humidorModel.findOne({
      _id: createInventoryDto.humidorId,
      userId: user._id,
      retailerId: retailer._id,
    });
    if (!humidor) throw new HttpException('Humidor not found', 404);
    let locationFields: Record<string, unknown>;
    if (createInventoryDto.wallId && createInventoryDto.shelfId) {
      const wall = humidor.walls?.find(
        (item) => String(item._id) === createInventoryDto.wallId,
      );
      const shelf = wall?.shelves?.find(
        (item) => String(item._id) === createInventoryDto.shelfId,
      );
      if (!wall || !shelf)
        throw new HttpException(
          'Wall or shelf not found in selected humidor',
          404,
        );
      if (createInventoryDto.shelfColumn > wall.columns)
        throw new HttpException(
          `Column must be within the wall (1–${wall.columns})`,
          400,
        );
      await this.ensureShelfCellAvailable(
        retailer._id,
        humidor._id,
        shelf.name,
        undefined,
        createInventoryDto.shelfColumn,
        undefined,
        wall._id,
        shelf._id,
      );
      locationFields = {
        wallId: wall._id,
        wallName: wall.name,
        shelfId: shelf._id,
        shelfName: shelf.name,
        shelfRow: undefined,
      };
    } else {
      const shelf = humidor.shelfes?.find(
        (item) => item.name === createInventoryDto.shelfName,
      );
      if (!shelf || !createInventoryDto.shelfRow)
        throw new HttpException(
          'Choose a wall and shelf in the selected humidor',
          400,
        );
      this.validateShelfPosition(
        shelf,
        createInventoryDto.shelfRow,
        createInventoryDto.shelfColumn,
      );
      await this.ensureShelfCellAvailable(
        retailer._id,
        humidor._id,
        shelf.name,
        createInventoryDto.shelfRow,
        createInventoryDto.shelfColumn,
      );
      locationFields = {};
    }

    const masterCigar = createInventoryDto.masterCigarId
      ? await this.masterDatabaseModel.findOne({
          _id: createInventoryDto.masterCigarId,
          status: { $in: ['active', 'approved'] },
        })
      : null;
    if (createInventoryDto.masterCigarId && !masterCigar)
      throw new HttpException('Active master cigar not found', 404);

    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createInventoryDto.image = uploadedFile.url;
    }

    const masterPrefillFields = masterCigar
      ? {
          masterCigarId: masterCigar._id,
          productLine: masterCigar.productLine,
          name: masterCigar.productLine,
          brand: masterCigar.brand,
          strength:
            this.normalizeMasterStrength(masterCigar.strength) ??
            createInventoryDto.strength,
          wrapper: masterCigar.wrapper || createInventoryDto.wrapper,
          smokingTime:
            this.normalizeMasterSmokingTime(masterCigar.estimatedSmokingTime) ??
            createInventoryDto.smokingTime,
          pairingSuggestions: masterCigar.pairingSuggestions?.filter(Boolean)
            .length
            ? masterCigar.pairingSuggestions.filter(Boolean)
            : createInventoryDto.pairingSuggestions,
        }
      : {
          productLine: createInventoryDto.name,
        };

    const staffPickFields = createInventoryDto.isStaffPick
      ? { staffPickAddedAt: new Date() }
      : {};

    const newArrivalFields = createInventoryDto.isNewArrival
      ? {
          arrivalDate: createInventoryDto.arrivalDate
            ? new Date(createInventoryDto.arrivalDate)
            : new Date(),
          autoRemoveDays: 30,
          newArrivalExpiresAt: this.computeNewArrivalExpiry(
            createInventoryDto.arrivalDate
              ? new Date(createInventoryDto.arrivalDate)
              : new Date(),
            30,
          ),
        }
      : {};

    const dailyFeaturedFields = createInventoryDto.isDailyFeatured
      ? { featuredDate: this.startOfDay(new Date()) }
      : {};

    const inventory = await this.inventoryRepository.create({
      ...createInventoryDto,
      ...masterPrefillFields,
      ...staffPickFields,
      ...newArrivalFields,
      ...dailyFeaturedFields,
      ...locationFields,
      userId: user._id,
      retailerId: retailer._id,
      humidorId: humidor._id,
      status: masterCigar ? 'active' : 'under_review',
    });
    if (!user.isInventory) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { isInventory: true },
        { new: true },
      );
    }

    if ((inventory as InventoryDocument).status === 'under_review') {
      await this.notifationService.notifyAdmin(
        'new_product_submission',
        'New Product Submission',
        `${retailer.storeName} submitted "${(inventory as any).productLine} ${(inventory as any).wrapper} ${(inventory as any).strength}" for review`,
        (inventory as InventoryDocument)._id.toString(),
        'newProductSubmissions',
      );
    }

    return inventory;
  }

  async getMyInventory(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(
      params,
      [
        'name',
        'brand',
        'productLine',
        'manufacturer',
        'country',
        'wrapper',
        'binder',
        'filler',
        'strength',
        'size',
        'length',
        'flavorNotes',
        'smokingTime',
        'description',
        'whyYoullLikeThis',
        'pairingSuggestions',
        'status',
      ],
      {
        userId: user._id,
        retailerId: retailer._id,
      },
    );
    const result = await this.inventoryRepository
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    const total =
      await this.inventoryRepository.countDocuments(whereConditions);
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getAllInventory(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(params, [
      'name',
      'brand',
      'productLine',
      'manufacturer',
      'country',
      'wrapper',
      'binder',
      'filler',
      'strength',
      'size',
      'length',
      'flavorNotes',
      'smokingTime',
      'description',
      'whyYoullLikeThis',
      'pairingSuggestions',
      'status',
    ]);
    const result = await this.inventoryRepository
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId')
      .populate('retailerId')
      .populate('humidorId')
      .populate('masterCigarId');
    const total =
      await this.inventoryRepository.countDocuments(whereConditions);
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getInventorys(
    shopslag: string,
    params: IFilterParams,
    options: IOptions,
    priceRange?: { minPrice?: number; maxPrice?: number },
  ) {
    const retailer = await this.retailerModel.findOne({ storeSlug: shopslag });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const user = await this.userModel.findById(retailer.userId);
    if (!user) throw new HttpException('User not found', 404);
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    // Public storefront route - only surface cigars the retailer has
    // approved for customer view, regardless of any status passed in.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _ignoredStatus, ...customerParams } = params;

    const priceCondition: Record<string, number> = {};
    if (priceRange?.minPrice !== undefined)
      priceCondition.$gte = priceRange.minPrice;
    if (priceRange?.maxPrice !== undefined)
      priceCondition.$lte = priceRange.maxPrice;

    const whereConditions = buildWhereConditions(
      customerParams,
      [
        'name',
        'brand',
        'productLine',
        'manufacturer',
        'country',
        'wrapper',
        'binder',
        'filler',
        'strength',
        'size',
        'length',
        'flavorNotes',
        'smokingTime',
        'description',
        'whyYoullLikeThis',
        'pairingSuggestions',
      ],
      {
        userId: user._id,
        retailerId: retailer._id,
        status: 'active',
        quantity: { $gt: 0 },
        ...(Object.keys(priceCondition).length > 0
          ? { price: priceCondition }
          : {}),
      },
    );
    const result = await this.inventoryRepository
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    const total =
      await this.inventoryRepository.countDocuments(whereConditions);
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getInventoryById(id: string) {
    const inventory = await this.inventoryRepository
      .findById(id)
      .populate('userId')
      .populate('retailerId')
      .populate('humidorId')
      .populate('masterCigarId');
    if (!inventory) throw new HttpException('Inventory not found', 404);
    const result = inventory.toObject() as Record<string, any>;
    const humidor = result.humidorId;
    return {
      ...result,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async updateInventory(
    userId: string,
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    file?: Express.Multer.File,
  ) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (
      updateInventoryDto.humidorId ||
      updateInventoryDto.wallId ||
      updateInventoryDto.shelfId ||
      updateInventoryDto.shelfName ||
      updateInventoryDto.shelfRow ||
      updateInventoryDto.shelfColumn
    ) {
      const humidor = await this.humidorModel.findOne({
        _id: updateInventoryDto.humidorId ?? inventory.humidorId,
        userId: inventory.userId,
        retailerId: inventory.retailerId,
      });
      if (!humidor) throw new HttpException('Humidor not found', 404);
      const shelfColumn =
        updateInventoryDto.shelfColumn ?? inventory.shelfColumn;
      const wallId = updateInventoryDto.wallId ?? inventory.wallId?.toString();
      const shelfId =
        updateInventoryDto.shelfId ?? inventory.shelfId?.toString();
      if (wallId && shelfId) {
        const wall = humidor.walls?.find((item) => String(item._id) === wallId);
        const shelf = wall?.shelves?.find(
          (item) => String(item._id) === shelfId,
        );
        if (!wall || !shelf)
          throw new HttpException(
            'Wall or shelf not found in selected humidor',
            404,
          );
        if (shelfColumn > wall.columns)
          throw new HttpException(
            `Column must be within the wall (1–${wall.columns})`,
            400,
          );
        await this.ensureShelfCellAvailable(
          inventory.retailerId,
          humidor._id,
          shelf.name,
          undefined,
          shelfColumn,
          id,
          wall._id,
          shelf._id,
        );
        updateInventoryDto.wallId = wall._id.toString();
        updateInventoryDto.shelfId = shelf._id.toString();
        updateInventoryDto.shelfName = shelf.name;
        (
          updateInventoryDto as CreateInventoryDto & { wallName?: string }
        ).wallName = wall.name;
        updateInventoryDto.shelfRow = undefined;
      } else {
        const shelfName = updateInventoryDto.shelfName ?? inventory.shelfName;
        const shelf = humidor.shelfes?.find((item) => item.name === shelfName);
        const shelfRow = updateInventoryDto.shelfRow ?? inventory.shelfRow;
        if (!shelf || !shelfRow)
          throw new HttpException('Wall and shelf are required', 400);
        this.validateShelfPosition(shelf, shelfRow, shelfColumn);
        await this.ensureShelfCellAvailable(
          inventory.retailerId,
          humidor._id,
          shelfName,
          shelfRow,
          shelfColumn,
          id,
        );
      }
    }
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateInventoryDto.image = uploadedFile.url;
    }
    const update: Record<string, unknown> = { ...updateInventoryDto };
    const unset: Record<string, string> = {};
    if (updateInventoryDto.isStaffPick === true && !inventory.isStaffPick)
      update.staffPickAddedAt = new Date();
    if (updateInventoryDto.isStaffPick === false) {
      delete update.staffPickBy;
      delete update.staffPickNote;
      unset.staffPickBy = '';
      unset.staffPickNote = '';
      unset.staffPickAddedAt = '';
    }
    if (updateInventoryDto.isNewArrival === true) {
      const arrivalDate = updateInventoryDto.arrivalDate
        ? new Date(updateInventoryDto.arrivalDate)
        : (inventory.arrivalDate ?? new Date());
      if (updateInventoryDto.arrivalDate || !inventory.isNewArrival) {
        const autoRemoveDays = inventory.autoRemoveDays ?? 30;
        update.arrivalDate = arrivalDate;
        update.autoRemoveDays = autoRemoveDays;
        update.newArrivalExpiresAt = this.computeNewArrivalExpiry(
          arrivalDate,
          autoRemoveDays,
        );
      }
    }
    if (updateInventoryDto.isNewArrival === false) {
      delete update.arrivalDate;
      unset.arrivalDate = '';
      unset.newArrivalNote = '';
      unset.autoRemoveDays = '';
      unset.newArrivalExpiresAt = '';
    }
    if (
      updateInventoryDto.isDailyFeatured === true &&
      !inventory.isDailyFeatured
    )
      update.featuredDate = this.startOfDay(new Date());
    if (updateInventoryDto.isDailyFeatured === false) {
      delete update.featuredNote;
      unset.featuredNote = '';
      unset.featuredDate = '';
      unset.featuredPrice = '';
    }
    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        $set: update,
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
      },
      { new: true },
    );
    return result;
  }

  async deleteInventory(userId: string, id: string) {
    await this.getOwnedInventory(userId, id);
    const result = await this.inventoryRepository.findByIdAndDelete(id);
    return result;
  }

  async recordSale(userId: string, id: string, dto: RecordSaleDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const inventory = await this.inventoryRepository.findOne({
      _id: id,
      retailerId: retailer._id,
    });
    if (!inventory) throw new HttpException('Inventory not found', 404);

    const quantitySold = dto.quantitySold ?? 1;
    if (quantitySold > inventory.quantity) {
      throw new HttpException('Sold quantity cannot exceed current stock', 400);
    }

    const previousQuantity = inventory.quantity;
    const newQuantity = previousQuantity - quantitySold;
    const soldAt = new Date();
    const lowStockThreshold = inventory.lowStockThreshold ?? 5;
    const crossedLowStockLevel =
      previousQuantity > lowStockThreshold && newQuantity <= lowStockThreshold;

    inventory.quantity = newQuantity;
    inventory.lastSoldDate = soldAt;
    inventory.totalSold = (inventory.totalSold ?? 0) + quantitySold;
    inventory.salesHistory = [
      ...(inventory.salesHistory ?? []),
      {
        quantitySold,
        unitPrice: inventory.price,
        totalAmount: Number((quantitySold * inventory.price).toFixed(2)),
        soldAt,
      },
    ];
    if (newQuantity === 0) inventory.status = 'out_of_stock';
    if (crossedLowStockLevel) {
      inventory.lastLowStockNotificationAt = soldAt;
    }

    await inventory.save();

    const notification = crossedLowStockLevel
      ? {
          type: newQuantity === 0 ? 'out_of_stock' : 'low_stock',
          title: newQuantity === 0 ? 'Out of Stock' : 'Low Inventory Alert',
          message:
            newQuantity === 0
              ? `${inventory.name} is out of stock`
              : `${inventory.name} has ${newQuantity} cigar(s) left`,
          inventoryId: inventory._id,
          quantity: newQuantity,
          lowStockThreshold,
          createdAt: soldAt,
        }
      : null;

    return {
      inventory,
      sale: {
        quantitySold,
        previousQuantity,
        quantity: newQuantity,
        soldAt,
      },
      notification,
    };
  }

  async adminUpdateStatus(id: string, status: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

    const wasUnderReview = inventory.status === 'under_review';

    // status 'active' e approve hocche ebong ei item MasterDatabase e nai (nijer deya info diye under_review chilo)
    if (status === 'active' && !inventory.masterCigarId) {
      const masterEntry = await this.masterDatabaseModel.create({
        productLine: inventory.name,
        brand: inventory.brand,
        strength: inventory.strength,
        wrapper: inventory.wrapper,
        estimatedSmokingTime: inventory.smokingTime,
        pairingSuggestions: inventory.pairingSuggestions,
        suggestedRetailPriceEach: inventory.price,
        suggestedRetailPricePerBox: inventory.pricePerBox,
        status: 'active',
        submittedByRetailer: inventory.retailerId,
      });

      inventory.masterCigarId = masterEntry._id;
    }

    inventory.status = status;
    await inventory.save();

    if (wasUnderReview && status === 'active') {
      await this.notifationService.notifyRetailer(
        inventory.userId,
        'product_approved',
        'Product Approved',
        `Your product "${inventory.name}" has been approved`,
        inventory._id,
        'productApprovalNotifications',
      );
    }

    return inventory;
  }

  // Cigars with no sale in `days` days (or never sold since being added)
  // and/or never searched by a customer - candidates to feature or discount.
  private buildOpportunityFilter(
    retailerId: mongoose.Types.ObjectId,
    days: number,
  ) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return {
      retailerId,
      status: 'active',
      quantity: { $gt: 0 },
      $or: [
        { lastSoldDate: { $lte: cutoff } },
        { lastSoldDate: { $exists: false }, createdAt: { $lte: cutoff } },
        { lastSoldDate: null, createdAt: { $lte: cutoff } },
      ],
    };
  }

  async getInventoryOpportunities(userId: string, days = OPPORTUNITY_DAYS) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const filter = this.buildOpportunityFilter(retailer._id, days);
    const items = await this.inventoryRepository
      .find(filter)
      .sort({ lastSoldDate: 1, createdAt: 1 });

    const now = Date.now();
    const data = items.map((item) => {
      const lastActivityDate = item.lastSoldDate ?? item.get('createdAt');
      const daysSinceLastSale = lastActivityDate
        ? Math.floor((now - new Date(lastActivityDate).getTime()) / 86400000)
        : null;
      return {
        ...item.toObject(),
        daysSinceLastSale,
        neverSearched: (item.totalSearches ?? 0) === 0,
      };
    });

    return { days, count: data.length, data };
  }

  async getInventoryOpportunitiesSummary(
    userId: string,
    days = OPPORTUNITY_DAYS,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const filter = this.buildOpportunityFilter(retailer._id, days);
    const count = await this.inventoryRepository.countDocuments(filter);

    return { days, count };
  }

  async featureInventory(id: string, dto: FeatureInventoryDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

    const type = dto.type ?? FeatureType.DAILY_FEATURED;
    const update =
      type === FeatureType.STAFF_PICK
        ? {
            isStaffPick: true,
            staffPickNote: dto.note,
            staffPickBy: dto.staffPickBy,
            staffPickAddedAt: new Date(),
          }
        : {
            isDailyFeatured: true,
            featuredNote: dto.note,
            featuredDate: this.startOfDay(new Date()),
          };

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    return result;
  }

  async applyDiscount(id: string, dto: DiscountInventoryDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

    const discountPrice =
      inventory.price - (inventory.price * dto.discountPercentage) / 100;

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isOnDiscount: true,
        discountPercentage: dto.discountPercentage,
        discountPrice: Number(discountPrice.toFixed(2)),
        discountedAt: new Date(),
      },
      { new: true },
    );
    return result;
  }

  async removeDiscount(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isOnDiscount: false,
        $unset: { discountPercentage: '', discountPrice: '', discountedAt: '' },
      },
      { new: true },
    );
    return result;
  }

  private formatStaffPick(item: Record<string, any>) {
    const humidor = item.humidorId;
    return {
      _id: item._id,
      name: item.name,
      brand: item.brand,
      strength: item.strength,
      size: item.size,
      smokingTime: item.smokingTime,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      description: item.description,
      pairingSuggestions: item.pairingSuggestions,
      staffPickNote: item.staffPickNote,
      staffPickBy: item.staffPickBy,
      staffPickAddedAt: item.staffPickAddedAt,
      wallName: item.wallName,
      shelfName: item.shelfName,
      shelfRow: item.shelfRow,
      shelfColumn: item.shelfColumn,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  private async getOwnedInventory(userId: string, id: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const inventory = await this.inventoryRepository.findOne({
      _id: id,
      retailerId: retailer._id,
    });
    if (!inventory) throw new HttpException('Inventory not found', 404);
    return inventory;
  }

  private normalizeMasterStrength(value?: string) {
    const normalized = value
      ?.trim()
      .toLowerCase()
      .replaceAll('_', '-')
      .replaceAll(' ', '-');
    return ['mild', 'mild-medium', 'medium', 'medium-full', 'full'].includes(
      normalized ?? '',
    )
      ? normalized
      : undefined;
  }

  private normalizeMasterSmokingTime(value?: string) {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    const amount = Number(normalized.match(/\d+(?:\.\d+)?/)?.[0]);
    if (!Number.isFinite(amount)) return undefined;
    const minutes = normalized.includes('hour') ? amount * 60 : amount;
    if (normalized.includes('+') || minutes >= 120) return '120+';
    if (minutes >= 90) return '90';
    if (minutes >= 60) return '60';
    return '30';
  }

  async addStaffPick(userId: string, id: string, dto: AddStaffPickDto) {
    await this.getOwnedInventory(userId, id);

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isStaffPick: true,
        staffPickBy: dto.staffPickBy,
        staffPickNote: dto.staffPickNote,
        staffPickAddedAt: new Date(),
      },
      { new: true },
    );
    return result;
  }

  async updateStaffPick(userId: string, id: string, dto: UpdateStaffPickDto) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (!inventory.isStaffPick)
      throw new HttpException('This item is not a staff pick', 400);

    const update: Record<string, string> = {};
    if (dto.staffPickBy !== undefined) update.staffPickBy = dto.staffPickBy;
    if (dto.staffPickNote !== undefined)
      update.staffPickNote = dto.staffPickNote;

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    return result;
  }

  async removeStaffPick(userId: string, id: string) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (!inventory.isStaffPick)
      throw new HttpException('This item is not a staff pick', 400);

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isStaffPick: false,
        $unset: { staffPickNote: '', staffPickBy: '', staffPickAddedAt: '' },
      },
      { new: true },
    );
    return result;
  }

  async getMyStaffPicks(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const items = await this.inventoryRepository
      .find({ retailerId: retailer._id, isStaffPick: true })
      .populate('humidorId', 'name')
      .sort({ staffPickAddedAt: -1 })
      .lean();

    const data = items.map((item) => this.formatStaffPick(item));
    return { count: data.length, data };
  }

  async getStaffPicksByStore(shopSlug: string) {
    const retailer = await this.retailerModel.findOne({
      storeSlug: shopSlug,
    });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const items = await this.inventoryRepository
      .find({
        retailerId: retailer._id,
        isStaffPick: true,
        status: 'active',
        quantity: { $gt: 0 },
      })
      .populate('humidorId', 'name')
      .sort({ staffPickAddedAt: -1 })
      .lean();

    const data = items.map((item) => this.formatStaffPick(item));
    const groupedByStaff = data.reduce<Record<string, typeof data>>(
      (acc, pick) => {
        const key = pick.staffPickBy || 'Staff';
        acc[key] = acc[key] ? [...acc[key], pick] : [pick];
        return acc;
      },
      {},
    );

    return { count: data.length, data, groupedByStaff };
  }

  private computeNewArrivalExpiry(arrivalDate: Date, autoRemoveDays: number) {
    const expiresAt = new Date(arrivalDate);
    expiresAt.setDate(expiresAt.getDate() + autoRemoveDays);
    return expiresAt;
  }

  private formatNewArrival(item: Record<string, any>) {
    const humidor = item.humidorId;
    const arrivalDate: Date | null = item.arrivalDate
      ? new Date(item.arrivalDate as string)
      : null;
    const daysShowing = arrivalDate
      ? Math.floor((Date.now() - arrivalDate.getTime()) / 86400000)
      : null;

    return {
      _id: item._id,
      name: item.name,
      brand: item.brand,
      strength: item.strength,
      size: item.size,
      smokingTime: item.smokingTime,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      pairingSuggestions: item.pairingSuggestions,
      newArrivalNote: item.newArrivalNote,
      arrivalDate: item.arrivalDate,
      daysShowing,
      autoRemoveDays: item.autoRemoveDays,
      newArrivalExpiresAt: item.newArrivalExpiresAt,
      wallName: item.wallName,
      shelfName: item.shelfName,
      shelfRow: item.shelfRow,
      shelfColumn: item.shelfColumn,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async markNewArrival(userId: string, id: string, dto: MarkNewArrivalDto) {
    await this.getOwnedInventory(userId, id);

    const arrivalDate = dto.arrivalDate
      ? new Date(dto.arrivalDate)
      : new Date();
    const autoRemoveDays = dto.autoRemoveDays ?? 30;

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isNewArrival: true,
        arrivalDate,
        newArrivalNote: dto.note,
        autoRemoveDays,
        newArrivalExpiresAt: this.computeNewArrivalExpiry(
          arrivalDate,
          autoRemoveDays,
        ),
      },
      { new: true },
    );
    return result;
  }

  async updateNewArrival(userId: string, id: string, dto: UpdateNewArrivalDto) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (!inventory.isNewArrival)
      throw new HttpException('This item is not a New Arrival', 400);

    const arrivalDate = dto.arrivalDate
      ? new Date(dto.arrivalDate)
      : inventory.arrivalDate;
    const autoRemoveDays = dto.autoRemoveDays ?? inventory.autoRemoveDays;

    const update: Record<string, unknown> = {
      newArrivalExpiresAt: this.computeNewArrivalExpiry(
        arrivalDate,
        autoRemoveDays,
      ),
    };
    if (dto.arrivalDate !== undefined) update.arrivalDate = arrivalDate;
    if (dto.autoRemoveDays !== undefined)
      update.autoRemoveDays = autoRemoveDays;
    if (dto.note !== undefined) update.newArrivalNote = dto.note;

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    return result;
  }

  async removeNewArrival(userId: string, id: string) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (!inventory.isNewArrival)
      throw new HttpException('This item is not a New Arrival', 400);

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isNewArrival: false,
        $unset: {
          newArrivalNote: '',
          newArrivalExpiresAt: '',
        },
      },
      { new: true },
    );
    return result;
  }

  async getMyNewArrivals(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const items = await this.inventoryRepository
      .find({ retailerId: retailer._id, isNewArrival: true })
      .populate('humidorId', 'name')
      .sort({ arrivalDate: -1 })
      .lean();

    const data = items.map((item) => this.formatNewArrival(item));
    return { count: data.length, data };
  }

  async getNewArrivalsByStore(shopSlug: string) {
    const retailer = await this.retailerModel.findOne({
      storeSlug: shopSlug,
    });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const items = await this.inventoryRepository
      .find({
        retailerId: retailer._id,
        isNewArrival: true,
        status: 'active',
        quantity: { $gt: 0 },
      })
      .populate('humidorId', 'name')
      .sort({ arrivalDate: -1 })
      .lean();

    const data = items.map((item) => this.formatNewArrival(item));
    const today: typeof data = [];
    const thisWeek: typeof data = [];
    const thisMonth: typeof data = [];

    for (const item of data) {
      if (item.daysShowing === 0) today.push(item);
      else if (item.daysShowing !== null && item.daysShowing <= 7)
        thisWeek.push(item);
      else thisMonth.push(item);
    }

    return {
      count: data.length,
      data,
      groupedByRecency: { today, thisWeek, thisMonth },
    };
  }

  private startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private normalizeSmokingTime(value?: string) {
    if (!value) return undefined;
    const minutes = Number(value.match(/\d+/)?.[0]);
    if (!Number.isFinite(minutes)) return undefined;
    if (minutes >= 120) return '120+';
    if (minutes >= 90) return '90';
    if (minutes >= 60) return '60';
    return '30';
  }

  private formatDailyFeatured(item: Record<string, any>) {
    const humidor = item.humidorId;
    const featuredPrice = item.featuredPrice;
    return {
      _id: item._id,
      name: item.name,
      brand: item.brand,
      strength: item.strength,
      size: item.size,
      wrapper: item.wrapper,
      smokingTime: item.smokingTime,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      description: item.description,
      pairingSuggestions: item.pairingSuggestions,
      featuredNote: item.featuredNote,
      featuredDate: item.featuredDate,
      featuredPrice,
      saving:
        typeof featuredPrice === 'number'
          ? Number((item.price - featuredPrice).toFixed(2))
          : undefined,
      wallName: item.wallName,
      shelfName: item.shelfName,
      shelfRow: item.shelfRow,
      shelfColumn: item.shelfColumn,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async setDailyFeatured(userId: string, id: string, dto: SetDailyFeaturedDto) {
    await this.getOwnedInventory(userId, id);

    const featuredDate = this.startOfDay(
      dto.featuredDate ? new Date(dto.featuredDate) : new Date(),
    );

    const update: Record<string, unknown> = {
      isDailyFeatured: true,
      featuredDate,
      featuredNote: dto.note,
    };
    if (dto.featuredPrice !== undefined) {
      update.featuredPrice = dto.featuredPrice;
    } else {
      update.$unset = { featuredPrice: '' };
    }

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    return result;
  }

  async updateDailyFeatured(
    userId: string,
    id: string,
    dto: UpdateDailyFeaturedDto,
  ) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (!inventory.isDailyFeatured)
      throw new HttpException('This item is not featured today', 400);

    const update: Record<string, unknown> = {};
    if (dto.featuredDate !== undefined)
      update.featuredDate = this.startOfDay(new Date(dto.featuredDate));
    if (dto.note !== undefined) update.featuredNote = dto.note;
    if (dto.featuredPrice !== undefined)
      update.featuredPrice = dto.featuredPrice;

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    return result;
  }

  async removeDailyFeatured(userId: string, id: string) {
    const inventory = await this.getOwnedInventory(userId, id);
    if (!inventory.isDailyFeatured)
      throw new HttpException('This item is not featured today', 400);

    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      {
        isDailyFeatured: false,
        $unset: { featuredNote: '', featuredDate: '', featuredPrice: '' },
      },
      { new: true },
    );
    return result;
  }

  async clearAllDailyFeaturedToday(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const today = this.startOfDay(new Date());
    const result = await this.inventoryRepository.updateMany(
      { retailerId: retailer._id, isDailyFeatured: true, featuredDate: today },
      {
        isDailyFeatured: false,
        $unset: { featuredNote: '', featuredDate: '', featuredPrice: '' },
      },
    );
    return { cleared: result.modifiedCount };
  }

  async getMyDailyFeatured(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const today = this.startOfDay(new Date());
    const tomorrow = this.startOfDay(
      new Date(today.getTime() + 24 * 60 * 60 * 1000),
    );

    const items = await this.inventoryRepository
      .find({
        retailerId: retailer._id,
        isDailyFeatured: true,
        featuredDate: { $in: [today, tomorrow] },
      })
      .populate('humidorId', 'name')
      .sort({ featuredDate: 1 })
      .lean();

    const data = items.map((item) => this.formatDailyFeatured(item));
    const isToday = (item: (typeof data)[number]) =>
      item.featuredDate &&
      new Date(item.featuredDate as string).getTime() === today.getTime();

    return {
      today: data.filter((item) => isToday(item)),
      tomorrow: data.filter((item) => !isToday(item)),
    };
  }

  async getDailyFeaturedByStore(shopSlug: string) {
    const retailer = await this.retailerModel.findOne({
      storeSlug: shopSlug,
    });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const today = this.startOfDay(new Date());
    const items = await this.inventoryRepository
      .find({
        retailerId: retailer._id,
        isDailyFeatured: true,
        featuredDate: today,
        status: 'active',
        quantity: { $gt: 0 },
      })
      .populate('humidorId', 'name')
      .lean();

    const data = items.map((item) => this.formatDailyFeatured(item));
    return { count: data.length, data };
  }

  // Powers the retailer "what should I do today" dashboard: stock alerts,
  // items awaiting admin review, top-searched cigars, and total stock on hand.
  async getDashboardInsights(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const [
      outOfStock,
      lowStock,
      underReview,
      topSearched,
      totalStockAgg,
      totalProducts,
    ] = await Promise.all([
      this.inventoryRepository
        .find({ retailerId: retailer._id, status: 'active', quantity: 0 })
        .select('name totalSearches')
        .sort({ totalSearches: -1 })
        .lean(),
      this.inventoryRepository
        .find({
          retailerId: retailer._id,
          status: 'active',
          quantity: { $gt: 0 },
          $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        })
        .select('name quantity lowStockThreshold')
        .sort({ quantity: 1 })
        .lean(),
      this.inventoryRepository
        .find({ retailerId: retailer._id, status: 'under_review' })
        .select('name createdAt')
        .sort({ createdAt: 1 })
        .lean(),
      this.inventoryRepository
        .find({
          retailerId: retailer._id,
          status: 'active',
          totalSearches: { $gt: 0 },
        })
        .select('name totalSearches quantity lowStockThreshold')
        .sort({ totalSearches: -1 })
        .limit(5)
        .lean(),
      this.inventoryRepository.aggregate([
        { $match: { retailerId: retailer._id, status: 'active' } },
        { $group: { _id: null, totalStock: { $sum: '$quantity' } } },
      ]),
      this.inventoryRepository.countDocuments({
        retailerId: retailer._id,
        status: 'active',
      }),
    ]);

    const stockStatus = (item: any) =>
      item.quantity === 0
        ? 'out_of_stock'
        : item.quantity <= item.lowStockThreshold
          ? 'low_stock'
          : 'in_stock';

    return {
      outOfStock: outOfStock.map((item: any) => ({
        _id: item._id,
        name: item.name,
        searches: item.totalSearches,
      })),
      lowStock: lowStock.map((item: any) => ({
        _id: item._id,
        name: item.name,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
      })),
      underReview: underReview.map((item: any) => ({
        _id: item._id,
        name: item.name,
        submittedAt: item.createdAt,
        daysWaiting: Math.floor(
          (Date.now() - new Date(item.createdAt as string).getTime()) /
            86400000,
        ),
      })),
      topSearched: topSearched.map((item: any) => ({
        _id: item._id,
        name: item.name,
        searches: item.totalSearches,
        stockStatus: stockStatus(item),
      })),
      totalStock: (totalStockAgg[0]?.totalStock as number) ?? 0,
      totalProducts,
    };
  }

  // Retailer-assisted "Customer Search" - staff search the same inventory a
  // customer would, on behalf of a customer standing in front of them.
  private formatForStaffSearch(item: Record<string, any>) {
    const humidor = item.humidorId;
    return {
      _id: item._id,
      name: item.name,
      brand: item.brand,
      strength: item.strength,
      wrapper: item.wrapper,
      size: item.size,
      smokingTime: item.smokingTime,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      pairingSuggestions: item.pairingSuggestions,
      inStock: item.quantity > 0,
      wallName: item.wallName,
      shelfName: item.shelfName,
      shelfRow: item.shelfRow,
      shelfColumn: item.shelfColumn,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async quickSearchForRetailer(
    userId: string,
    params: {
      searchTerm?: string;
      strength?: string;
      size?: string;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
    },
    options: IOptions,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const filter: Record<string, unknown> = {
      retailerId: retailer._id,
      status: 'active',
    };
    if (params.searchTerm) {
      const escapedSearch = params.searchTerm.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const regex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ name: regex }, { brand: regex }];
    }
    if (params.strength) filter.strength = params.strength;
    if (params.size) filter.size = params.size;
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      filter.price = {
        ...(params.minPrice !== undefined && { $gte: params.minPrice }),
        ...(params.maxPrice !== undefined && { $lte: params.maxPrice }),
      };
    }
    if (params.inStockOnly) filter.quantity = { $gt: 0 };

    const [items, total] = await Promise.all([
      this.inventoryRepository
        .find(filter)
        .populate('humidorId', 'name')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.inventoryRepository.countDocuments(filter),
    ]);

    return {
      meta: { page, limit, total },
      data: items.map((item) => this.formatForStaffSearch(item)),
    };
  }

  async browseInventoryForRetailer(
    userId: string,
    params: {
      humidorId?: string;
      shelfName?: string;
      inStockOnly?: boolean;
      sortBy?: 'name' | 'price' | 'strength';
      sortOrder?: 'asc' | 'desc';
    },
    options: IOptions,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const { limit, page, skip } = paginationHelper(options);

    const filter: Record<string, unknown> = {
      retailerId: retailer._id,
      status: 'active',
    };
    if (params.humidorId) filter.humidorId = params.humidorId;
    if (params.shelfName) filter.shelfName = params.shelfName;
    if (params.inStockOnly !== false) filter.quantity = { $gt: 0 };

    const sortField = params.sortBy ?? 'name';
    const sortDir = params.sortOrder === 'desc' ? -1 : 1;

    const [items, total, totalInventory] = await Promise.all([
      this.inventoryRepository
        .find(filter)
        .populate('humidorId', 'name')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.inventoryRepository.countDocuments(filter),
      this.inventoryRepository.countDocuments({ retailerId: retailer._id }),
    ]);

    return {
      meta: { page, limit, total, totalInventory },
      data: items.map((item) => this.formatForStaffSearch(item)),
    };
  }

  private scoreGuidedMatch(item: Record<string, any>, dto: GuidedDiscoveryDto) {
    let score = 0;
    const reasons: string[] = [];
    const strengthScale: Record<string, number> = {
      mild: 1,
      'mild-medium': 2,
      medium: 3,
      'medium-full': 4,
      full: 5,
    };

    if (dto.strength && item.strength) {
      const wanted = strengthScale[dto.strength];
      const actual = strengthScale[String(item.strength).toLowerCase()];
      if (wanted !== undefined && actual !== undefined) {
        const distance = Math.abs(wanted - actual);
        if (distance === 0) {
          score += 40;
          reasons.push(`matches your ${dto.strength} strength preference`);
        } else if (distance === 1) {
          score += 20;
          reasons.push(
            `close to your ${dto.strength} strength preference (${item.strength})`,
          );
        }
      }
    }

    if (dto.minBudget !== undefined || dto.maxBudget !== undefined) {
      const price = item.price as number;
      const withinBudget =
        (dto.minBudget === undefined || price >= dto.minBudget) &&
        (dto.maxBudget === undefined || price <= dto.maxBudget);
      if (withinBudget) {
        score += 30;
        reasons.push('within your budget');
      } else if (dto.maxBudget !== undefined && price <= dto.maxBudget * 1.2) {
        score += 15;
        reasons.push('slightly over budget but close');
      }
    }

    if (dto.wrapperPreference) {
      const wrapper = String(
        item.wrapper || item.masterCigarId?.wrapper || '',
      ).toLowerCase();
      if (wrapper.includes(dto.wrapperPreference.toLowerCase())) {
        score += 15;
        reasons.push(`${dto.wrapperPreference} wrapper as requested`);
      }
    }

    if (dto.smokingTime) {
      const itemSmokingTime: string | undefined =
        item.smokingTime ||
        this.normalizeMasterSmokingTime(
          item.masterCigarId?.estimatedSmokingTime,
        );
      const match = itemSmokingTime?.match(/\d+/);
      if (match) {
        const actualMinutes = Number(match[0]);
        const wantedMinutes =
          dto.smokingTime === '120+' ? 120 : Number(dto.smokingTime);
        const distance = Math.abs(actualMinutes - wantedMinutes);
        if (distance <= 15) {
          score += 10;
          reasons.push('fits the smoking time you asked for');
        } else if (distance <= 30) {
          score += 5;
        }
      }
    }

    if (dto.preference === NewOrFamiliarPreference.FAMILIAR) {
      if (item.isStaffPick || (item.totalSearches ?? 0) > 0) {
        score += 10;
        reasons.push('a popular pick other customers already love');
      }
    } else if (dto.preference === NewOrFamiliarPreference.NEW) {
      if (item.isNewArrival) {
        score += 10;
        reasons.push('newly arrived - something different to try');
      }
    }

    return { score, reasons };
  }

  async guidedDiscoverySearch(userId: string, dto: GuidedDiscoveryDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const candidates = await this.inventoryRepository
      .find({
        retailerId: retailer._id,
        status: 'active',
        quantity: { $gt: 0 },
      })
      .populate('humidorId', 'name')
      .populate('masterCigarId', 'wrapper estimatedSmokingTime flavorNotes')
      .lean();

    const ranked = candidates
      .map((item) => ({ item, ...this.scoreGuidedMatch(item, dto) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, dto.limit ?? 5);

    const labels = ['Best Match', 'Great Choice', 'Alternative Option'];

    return ranked.map(({ item, reasons }, index) => ({
      rank: index + 1,
      label: labels[index] ?? 'Alternative Option',
      ...this.formatForStaffSearch(item),
      matchReason:
        reasons.length > 0
          ? `Recommended because it's ${reasons.join(' and ')}`
          : 'A solid option from current inventory',
    }));
  }

  async getCustomerViewDetail(userId: string, id: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const item = await this.inventoryRepository
      .findOne({ _id: id, retailerId: retailer._id })
      .populate('humidorId', 'name')
      .populate(
        'masterCigarId',
        'flavorNotes estimatedSmokingTime whyYoullLikeThis',
      )
      .lean();
    if (!item) throw new HttpException('Inventory not found', 404);

    const anyItem = item as Record<string, any>;
    const master = anyItem.masterCigarId;
    const today = this.startOfDay(new Date());
    const isFeaturedToday =
      anyItem.isDailyFeatured &&
      anyItem.featuredDate &&
      new Date(anyItem.featuredDate as string).getTime() === today.getTime();

    const displayPrice = isFeaturedToday
      ? (anyItem.featuredPrice ?? anyItem.price)
      : anyItem.isOnDiscount
        ? anyItem.discountPrice
        : anyItem.price;

    const recommendationNote =
      anyItem.staffPickNote ||
      (isFeaturedToday ? anyItem.featuredNote : undefined) ||
      anyItem.newArrivalNote ||
      master?.whyYoullLikeThis;

    return {
      _id: anyItem._id,
      name: anyItem.name,
      brand: anyItem.brand,
      strength: anyItem.strength,
      wrapper: anyItem.wrapper,
      size: anyItem.size,
      image: anyItem.image,
      description: anyItem.description,
      flavorNotes: master?.flavorNotes,
      smokingTime:
        anyItem.smokingTime ??
        this.normalizeMasterSmokingTime(master?.estimatedSmokingTime),
      pairingSuggestions: anyItem.pairingSuggestions,
      price: anyItem.price,
      displayPrice,
      isOnDiscount: anyItem.isOnDiscount,
      isFeaturedToday,
      recommendationNote,
      location: {
        humidorName:
          anyItem.humidorId && typeof anyItem.humidorId === 'object'
            ? anyItem.humidorId.name
            : undefined,
        wallName: anyItem.wallName,
        shelfName: anyItem.shelfName,
        shelfRow: anyItem.shelfRow,
        shelfColumn: anyItem.shelfColumn,
      },
      quantity: anyItem.quantity,
      inStock: anyItem.quantity > 0,
    };
  }

  async generateCustomerShareLink(userId: string, id: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const item = await this.inventoryRepository.findOne({
      _id: id,
      retailerId: retailer._id,
    });
    if (!item) throw new HttpException('Inventory not found', 404);

    const targetUrl = buildProductQrTarget(retailer.storeSlug, id);
    const { url: qrCodeUrl } = await generateAndUploadQrCode(targetUrl);

    return { url: targetUrl, qrCodeUrl };
  }

  // "🎲 Surprise Me" - weighted-random pick for a browsing customer, biased
  // toward staff picks / new arrivals / today's featured / rarely-searched
  // "hidden gems", and away from the already-popular. `excludeIds` is the
  // session's previously-shown picks, kept client-side and echoed back each
  // "Try Another" so the same cigar never repeats within a session.
  async getSurpriseMe(shopSlug: string, excludeIds: string[]) {
    const retailer = await this.retailerModel.findOne({
      storeSlug: shopSlug,
    });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const comeBackTomorrow = {
      limitReached: true,
      message:
        "You've seen all our surprise picks today! Come back tomorrow for new surprises 😊",
    };

    const validExcludeIds = excludeIds.filter((id) =>
      mongoose.isValidObjectId(id),
    );
    const triesSoFar = validExcludeIds.length;
    if (triesSoFar >= SURPRISE_ME_MAX_TRIES) return comeBackTomorrow;

    const candidates = await this.inventoryRepository
      .find({
        retailerId: retailer._id,
        status: 'active',
        quantity: { $gt: 0 },
        _id: { $nin: validExcludeIds },
      })
      .populate('humidorId', 'name')
      .populate('masterCigarId', 'flavorNotes estimatedSmokingTime')
      .lean();
    if (candidates.length === 0) return comeBackTomorrow;

    const today = this.startOfDay(new Date());
    const avgSearches =
      candidates.reduce(
        (sum: number, item: any) => sum + ((item.totalSearches as number) ?? 0),
        0,
      ) / candidates.length;

    const weighted = candidates.map((item: any) => {
      let weight = 1;
      const reasons: string[] = [];

      if (item.isStaffPick) {
        weight += 3;
        reasons.push('a staff pick');
      }
      if (item.isNewArrival) {
        weight += 3;
        reasons.push('a fresh new arrival');
      }
      const featuredToday =
        item.isDailyFeatured &&
        item.featuredDate &&
        new Date(item.featuredDate as string).getTime() === today.getTime();
      if (featuredToday) {
        weight += 3;
        reasons.push("today's featured cigar");
      }
      if ((item.totalSearches ?? 0) === 0) {
        weight += 2;
        reasons.push('a hidden gem in our humidor');
      } else if (avgSearches > 0 && item.totalSearches > avgSearches) {
        weight = Math.max(1, weight - 1);
      }

      return { item, weight, reasons };
    });

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = weighted[weighted.length - 1];
    for (const candidate of weighted) {
      roll -= candidate.weight;
      if (roll <= 0) {
        chosen = candidate;
        break;
      }
    }

    const { item, reasons } = chosen;
    const master = item.masterCigarId;
    const whyThisCigar =
      reasons.length > 0
        ? `This is ${reasons.join(' and ')} - you might just find your new favorite today.`
        : 'A hidden gem in our humidor - you might just find your new favorite today.';

    return {
      limitReached: false,
      triesUsed: triesSoFar + 1,
      triesRemaining: SURPRISE_ME_MAX_TRIES - (triesSoFar + 1),
      maxTries: SURPRISE_ME_MAX_TRIES,
      item: {
        _id: item._id,
        name: item.name,
        brand: item.brand,
        strength: item.strength,
        wrapper: item.wrapper,
        size: item.size,
        image: item.image,
        smokingTime:
          item.smokingTime ??
          this.normalizeMasterSmokingTime(master?.estimatedSmokingTime),
        flavorNotes: master?.flavorNotes,
        pairingSuggestions: item.pairingSuggestions,
        price: item.price,
        quantity: item.quantity,
        location: {
          humidorName:
            item.humidorId && typeof item.humidorId === 'object'
              ? item.humidorId.name
              : undefined,
          wallName: item.wallName,
          shelfName: item.shelfName,
          shelfRow: item.shelfRow,
          shelfColumn: item.shelfColumn,
        },
        whyThisCigar,
      },
    };
  }

  async getRelatedCigars(shopSlug: string, id: string) {
    const retailer = await this.retailerModel.findOne({
      storeSlug: shopSlug,
    });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const current = await this.inventoryRepository.findOne({
      _id: id,
      retailerId: retailer._id,
    });
    if (!current) throw new HttpException('Inventory not found', 404);

    const projection =
      'name brand strength wrapper size smokingTime image price quantity status pairingSuggestions';
    const baseQuery = {
      retailerId: retailer._id,
      status: 'active',
      quantity: { $gt: 0 },
      _id: { $ne: current._id },
    };

    // "You Might Also Enjoy" - same brand or same wrapper, most popular first
    const youMightAlsoEnjoy = await this.inventoryRepository
      .find({
        ...baseQuery,
        $or: [{ brand: current.brand }, { wrapper: current.wrapper }],
      })
      .select(projection)
      .sort({ totalSold: -1, totalViews: -1 })
      .limit(4)
      .lean();

    // "Looking for Something More Exclusive?" - pricier picks, most expensive first
    const moreExclusive = await this.inventoryRepository
      .find({ ...baseQuery, price: { $gt: current.price } })
      .select(projection)
      .sort({ price: -1 })
      .limit(3)
      .lean();

    // "Similar Cigars" - same strength & wrapper, useful as an out-of-stock alternative
    const similarCigars = await this.inventoryRepository
      .find({
        ...baseQuery,
        strength: current.strength,
        wrapper: current.wrapper,
      })
      .select(projection)
      .sort({ price: 1 })
      .limit(4)
      .lean();

    return { youMightAlsoEnjoy, moreExclusive, similarCigars };
  }

  async getMoreExclusiveCigars(shopSlug: string, id: string) {
    const retailer = await this.retailerModel.findOne({
      storeSlug: shopSlug,
    });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const current = await this.inventoryRepository.findOne({
      _id: id,
      retailerId: retailer._id,
    });
    if (!current) throw new HttpException('Inventory not found', 404);

    // "Looking for Something More Exclusive?" - pricier picks, most expensive first
    return this.inventoryRepository
      .find({
        retailerId: retailer._id,
        status: 'active',
        quantity: { $gt: 0 },
        _id: { $ne: current._id },
        price: { $gt: current.price },
      })
      .select(
        'name brand strength wrapper size smokingTime image price quantity status pairingSuggestions',
      )
      .sort({ price: -1 })
      .limit(3)
      .lean();
  }
}
