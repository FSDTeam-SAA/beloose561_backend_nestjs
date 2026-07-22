import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
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
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { AddStaffPickDto } from './dto/add-staff-pick.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { DiscountInventoryDto } from './dto/discount-inventory.dto';
import { FeatureInventoryDto, FeatureType } from './dto/feature-inventory.dto';
import {
  GuidedDiscoveryDto,
  NewOrFamiliarPreference,
} from './dto/guided-discovery.dto';
import { MarkNewArrivalDto } from './dto/mark-new-arrival.dto';
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
  ) {}

  async createInventory(
    userId: string,
    createInventoryDto: CreateInventoryDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const humidor = await this.humidorModel.findOne({ userId: user._id });
    if (!humidor) throw new HttpException('Humidor not found', 404);
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createInventoryDto.image = uploadedFile.url;
    }

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
      ...newArrivalFields,
      ...dailyFeaturedFields,
      userId: user._id,
      retailerId: retailer._id,
      humidorId: humidor._id,
      status: 'under_review',
    });
    if (!user.isInventory) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { isInventory: true },
        { new: true },
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
      'status',
    ]);
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

  async getInventorys(
    shopslag: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const retailer = await this.retailerModel.findOne({ storeSlug: shopslag });
    if (!retailer) throw new HttpException('Retailer not found', 404);
    const user = await this.userModel.findById(retailer.userId);
    if (!user) throw new HttpException('User not found', 404);
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

  async getInventoryById(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
    return inventory;
  }

  async updateInventory(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    file?: Express.Multer.File,
  ) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateInventoryDto.image = uploadedFile.url;
    }
    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      updateInventoryDto,
      { new: true },
    );
    return result;
  }

  async deleteInventory(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
    const result = await this.inventoryRepository.findByIdAndDelete(id);
    return result;
  }

  // async adminUpdateStatus(id: string, status: string) {
  //   const inventory = await this.inventoryRepository.findById(id);
  //   if (!inventory) throw new HttpException('Inventory not found', 404);
  //   const result = await this.inventoryRepository.findByIdAndUpdate(
  //     id,
  //     { status },
  //     { new: true },
  //   );
  //   return result;
  // }

  async adminUpdateStatus(id: string, status: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

    // status 'active' e approve hocche ebong ei item MasterDatabase e nai (nijer deya info diye under_review chilo)
    if (status === 'active' && !inventory.masterCigarId) {
      const masterEntry = await this.masterDatabaseModel.create({
        name: inventory.name,
        brand: inventory.brand,
        strength: inventory.strength,
        wrapper: inventory.wrapper,
        size: inventory.size,
        image: inventory.image,
        description: inventory.description,
        status: 'approved',
        submittedByRetailer: inventory.retailerId,
      });

      inventory.masterCigarId = masterEntry._id;
    }

    inventory.status = status;
    await inventory.save();

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
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      description: item.description,
      staffPickNote: item.staffPickNote,
      staffPickBy: item.staffPickBy,
      staffPickAddedAt: item.staffPickAddedAt,
      shelfName: item.shelfName,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async addStaffPick(id: string, dto: AddStaffPickDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

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

  async updateStaffPick(id: string, dto: UpdateStaffPickDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
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

  async removeStaffPick(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
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
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      newArrivalNote: item.newArrivalNote,
      arrivalDate: item.arrivalDate,
      daysShowing,
      autoRemoveDays: item.autoRemoveDays,
      newArrivalExpiresAt: item.newArrivalExpiresAt,
      shelfName: item.shelfName,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async markNewArrival(id: string, dto: MarkNewArrivalDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

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

  async updateNewArrival(id: string, dto: UpdateNewArrivalDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
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

  async removeNewArrival(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
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
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      description: item.description,
      featuredNote: item.featuredNote,
      featuredDate: item.featuredDate,
      featuredPrice,
      saving:
        typeof featuredPrice === 'number'
          ? Number((item.price - featuredPrice).toFixed(2))
          : undefined,
      shelfName: item.shelfName,
      humidorName:
        humidor && typeof humidor === 'object' ? humidor.name : undefined,
    };
  }

  async setDailyFeatured(id: string, dto: SetDailyFeaturedDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);

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

  async updateDailyFeatured(id: string, dto: UpdateDailyFeaturedDto) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
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

  async removeDailyFeatured(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
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

    const [outOfStock, lowStock, underReview, topSearched, totalStockAgg] =
      await Promise.all([
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
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      inStock: item.quantity > 0,
      shelfName: item.shelfName,
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
      const regex = new RegExp(params.searchTerm, 'i');
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
      medium: 2,
      full: 3,
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
      const masterSmokingTime: string | undefined =
        item.masterCigarId?.smokingTime;
      const match = masterSmokingTime?.match(/\d+/);
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
      .populate('masterCigarId', 'wrapper smokingTime flavorNotes')
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
      .populate('masterCigarId', 'flavorNotes smokingTime whyYoullLikeThis')
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
      smokingTime: master?.smokingTime,
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
        shelfName: anyItem.shelfName,
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
      .populate('masterCigarId', 'flavorNotes smokingTime')
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
        smokingTime: master?.smokingTime,
        flavorNotes: master?.flavorNotes,
        price: item.price,
        quantity: item.quantity,
        location: {
          humidorName:
            item.humidorId && typeof item.humidorId === 'object'
              ? item.humidorId.name
              : undefined,
          shelfName: item.shelfName,
        },
        whyThisCigar,
      },
    };
  }
}
