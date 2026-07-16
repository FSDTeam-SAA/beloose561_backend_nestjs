import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory, InventoryDocument } from './entities/inventory.entity';

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
    const inventory = await this.inventoryRepository.create({
      ...createInventoryDto,
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
}
