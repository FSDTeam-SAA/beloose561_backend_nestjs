import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model } from 'mongoose';
import * as XLSX from 'xlsx';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/entities/inventory.entity';
import {
  CreateMasterDatabaseDto,
  MasterDatabaseStatus,
} from './dto/create-master-database.dto';
import { UpdateMasterDatabaseDto } from './dto/update-master-database.dto';
import {
  MasterDatabase,
  MasterDatabaseDocument,
} from './entities/master-database.entity';

@Injectable()
export class MasterDatabaseService {
  constructor(
    @InjectModel(MasterDatabase.name)
    private readonly masterBatabaseModel: Model<MasterDatabaseDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  async createMasterDatabase(createMasterDatabaseDto: CreateMasterDatabaseDto) {
    const strength = createMasterDatabaseDto.strength ?? '';
    const wrapper = createMasterDatabaseDto.wrapper ?? '';
    const existing = await this.masterBatabaseModel.exists({
      brand: createMasterDatabaseDto.brand,
      productLine: createMasterDatabaseDto.productLine,
      strength,
      wrapper,
    });
    if (existing) {
      throw new HttpException('Master item already exists', 409);
    }
    const masterDatabase = await this.masterBatabaseModel.create({
      ...createMasterDatabaseDto,
      strength,
      wrapper,
    });

    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async uploadBulkMasterDatabase(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
      throw new BadRequestException('No sheet found in uploaded file');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });
    if (!rows.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const mappedRows = rows
      .map((row) => this.toMasterDatabaseEntry(row))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (!mappedRows.length) {
      throw new BadRequestException(
        'No valid rows found. Required columns: Brand, Product Line',
      );
    }

    const ops = mappedRows.map((entry) => ({
      updateOne: {
        filter: {
          brand: entry.brand,
          productLine: entry.productLine,
          strength: entry.strength ?? '',
          wrapper: entry.wrapper ?? '',
        },
        update: { $setOnInsert: entry },
        upsert: true,
      },
    }));

    const result = await this.masterBatabaseModel.bulkWrite(ops, {
      ordered: false,
    });
    const bulkResult = result as unknown as {
      upsertedCount?: number;
      nUpserted?: number;
    };
    const insertedCount = bulkResult.upsertedCount ?? bulkResult.nUpserted ?? 0;
    const invalidCount = rows.length - mappedRows.length;
    const duplicateSkippedCount = mappedRows.length - insertedCount;

    return {
      totalRows: rows.length,
      insertedCount,
      duplicateSkippedCount,
      invalidCount,
    };
  }

  private normalizeKey(key: string): string {
    return key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private getValue(row: Record<string, unknown>, ...aliases: string[]): string {
    const wanted = aliases.map((a) => this.normalizeKey(a));
    for (const [rowKey, value] of Object.entries(row)) {
      if (wanted.includes(this.normalizeKey(rowKey))) {
        return String(value ?? '').trim();
      }
    }
    return '';
  }

  private parsePrice(raw: string): number | undefined {
    if (!raw) return undefined;
    const cleaned = raw.replace(/[^0-9.-]/g, '');
    if (!cleaned) return undefined;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : undefined;
  }

  private toMasterDatabaseEntry(row: Record<string, unknown>) {
    const productLine = this.getValue(row, 'productLine', 'product line');
    const brand = this.getValue(row, 'brand');
    if (!productLine || !brand) return null;

    const list = (...aliases: string[]) =>
      this.getValue(row, ...aliases)
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const status =
      this.getValue(row, 'status').toLowerCase() || MasterDatabaseStatus.ACTIVE;
    const ringGaugeRaw = this.getValue(row, 'ringGauge');
    const ringGauge = ringGaugeRaw ? Number(ringGaugeRaw) : undefined;
    if (
      !Object.values(MasterDatabaseStatus).includes(
        status as MasterDatabaseStatus,
      ) ||
      (ringGauge !== undefined &&
        (!Number.isInteger(ringGauge) || ringGauge < 1))
    )
      return null;

    const eachRaw = this.getValue(
      row,
      'suggestedRetailPriceEach',
      'suggested retail price (each)',
      'price',
    );
    const boxRaw = this.getValue(
      row,
      'suggestedRetailPricePerBox',
      'suggested retail price (box)',
    );

    return {
      productLine,
      brand,
      name: this.getValue(row, 'name', 'cigar name'),
      manufacturer: this.getValue(row, 'manufacturer'),
      country: this.getValue(row, 'country', 'country of origin'),
      originRegion: this.getValue(row, 'originRegion'),
      upcCodes: list('upcCodes', 'upc'),
      binder: this.getValue(row, 'binder'),
      filler: list('filler'),
      vitola: this.getValue(row, 'vitola'),
      size: this.getValue(row, 'size'),
      length: this.getValue(row, 'length'),
      ringGauge,
      flavorNotes: list('flavorNotes', 'flavor profiles'),
      tastingNotes: this.getValue(row, 'tastingNotes'),
      description: this.getValue(row, 'description'),
      whyYoullLikeThis: this.getValue(row, 'whyYoullLikeThis'),
      image: this.getValue(row, 'image', 'images'),
      thumbnail: this.getValue(row, 'thumbnail'),
      strength: this.getValue(row, 'strength'),
      wrapper: this.getValue(row, 'wrapper'),
      estimatedSmokingTime: this.getValue(
        row,
        'estimatedSmokingTime',
        'estimated smoking time',
      ),
      pairingSuggestions: list('pairingSuggestions'),
      suggestedRetailPriceEach: this.parsePrice(eachRaw),
      suggestedRetailPricePerBox: this.parsePrice(boxRaw),
      status,
    };
  }

  async getAllMasterDatabase(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { upc, upcCode, ...restParams } = params as any;
    const upcFilter = upc || upcCode;
    const extraConditions: Record<string, unknown> = {};
    if (upcFilter) {
      extraConditions.upcCodes = upcFilter;
    }

    const whereConditions = buildWhereConditions(
      restParams,
      [
        'productLine',
        'brand',
        'name',
        'strength',
        'wrapper',
        'estimatedSmokingTime',
        'pairingSuggestions',
        'status',
        'upcCodes',
      ],
      extraConditions,
    );

    const result = await this.masterBatabaseModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('submittedByRetailer');

    const total =
      await this.masterBatabaseModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getMasterDatabaseById(id: string) {
    this.validateMasterId(id);
    const masterDatabase = await this.masterBatabaseModel.findById(id);
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async updateMasterDatabaseById(
    id: string,
    updateMasterDatabaseDto: UpdateMasterDatabaseDto,
  ) {
    this.validateMasterId(id);
    const masterDatabase = await this.masterBatabaseModel.findByIdAndUpdate(
      id,
      updateMasterDatabaseDto,
      { new: true, runValidators: true },
    );
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async deleteMasterDatabaseById(id: string) {
    this.validateMasterId(id);
    const inUse = await this.inventoryModel.exists({ masterCigarId: id });
    if (inUse) {
      throw new HttpException(
        'Cannot delete: this master item is used in inventory',
        409,
      );
    }
    const masterDatabase = await this.masterBatabaseModel.findByIdAndDelete(id);
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  private validateMasterId(id: string) {
    if (!isObjectIdOrHexString(id)) {
      throw new BadRequestException('Invalid master cigar ID');
    }
  }

  async findByUpcCode(upcCode: string) {
    const code = upcCode.trim();
    if (!code) throw new BadRequestException('UPC code is required');
    const masterDatabase = await this.masterBatabaseModel.findOne({
      upcCodes: code,
      status: 'active',
    });
    if (!masterDatabase)
      throw new HttpException('Cigar not found for this UPC', 404);
    return masterDatabase;
  }
}
