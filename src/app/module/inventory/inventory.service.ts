import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
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
import { MarkNewArrivalDto } from './dto/mark-new-arrival.dto';
import { SetDailyFeaturedDto } from './dto/set-daily-featured.dto';
import { UpdateDailyFeaturedDto } from './dto/update-daily-featured.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateNewArrivalDto } from './dto/update-new-arrival.dto';
import { UpdateStaffPickDto } from './dto/update-staff-pick.dto';
import { Inventory, InventoryDocument } from './entities/inventory.entity';

const OPPORTUNITY_DAYS = 90;

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

  async adminUpdateStatus(id: string, status: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) throw new HttpException('Inventory not found', 404);
    const result = await this.inventoryRepository.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    return result;
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
}
