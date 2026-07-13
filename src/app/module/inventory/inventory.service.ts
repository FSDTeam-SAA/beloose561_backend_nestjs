import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { ReceiveShipmentDto } from './dto/receive-shipment.dto';
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

  private resolveStatus(
    quantity: number,
    masterStatus?: string,
    currentStatus?: string,
  ) {
    if (currentStatus === 'under_review') return 'under_review';
    if (masterStatus !== undefined && masterStatus !== 'approved') {
      return 'under_review';
    }
    return quantity <= 0 ? 'out_of_stock' : 'active';
  }

  private async findOrCreateMasterDatabase(
    customName: string,
    customBrand: string,
    customStrength: string,
    customWrapper: string,
    customSize: string,
    customImage: string | undefined,
    customDescription: string,
    retailerId: Types.ObjectId,
  ) {
    const existing = await this.masterDatabaseModel.findOne({
      name: new RegExp(`^${customName.trim()}$`, 'i'),
    });
    if (existing) return existing;

    return this.masterDatabaseModel.create({
      name: customName,
      brand: customBrand,
      strength: customStrength,
      wrapper: customWrapper,
      size: customSize,
      image: customImage,
      description: customDescription,
      status: 'pending',
      submittedByRetailer: retailerId,
    });
  }

  private async getRetailerByUserId(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    return { user, retailer };
  }

  async getAllInventory(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const { retailer } = await this.getRetailerByUserId(userId);
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(
      params,
      ['customName', 'customBrand', 'customWrapper', 'customSize'],
      { storeId: retailer._id },
    );

    const result = await this.inventoryRepository
      .find(whereConditions)
      .populate('masterCigarId')
      .populate('humidorId')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total =
      await this.inventoryRepository.countDocuments(whereConditions);

    return {
      meta: { page, limit, total },
      data: result.map((item) => ({
        ...item,
        isLowStock:
          item.quantity > 0 && item.quantity <= (item.lowStockThreshold ?? 5),
      })),
    };
  }

  async createInventory(
    userId: string,
    createInventoryDto: CreateInventoryDto,
    file?: Express.Multer.File,
  ) {
    const { user, retailer } = await this.getRetailerByUserId(userId);
    const humidor = await this.humidorModel.findOne({
      _id: createInventoryDto.humidorId,
      retailerId: retailer._id,
    });
    if (!humidor) throw new HttpException('Humidor not found', 404);
    const shelf = humidor.shelfes.find(
      (item) =>
        item.name.toLowerCase() ===
        createInventoryDto.shelfName.trim().toLowerCase(),
    );
    if (!shelf) throw new HttpException('Shelf not found', 404);

    const {
      masterCigarId,
      customName,
      customBrand,
      customStrength,
      customWrapper,
      customSize,
      customImage,
      customDescription,
      ...rest
    } = createInventoryDto;

    let masterDatabase: MasterDatabaseDocument | null;

    if (masterCigarId) {
      masterDatabase = await this.masterDatabaseModel.findById(masterCigarId);
      if (!masterDatabase)
        throw new HttpException('Master cigar not found', 404);
    } else {
      let uploadedImage = customImage;
      if (file) {
        const uploadedFile = await fileUpload.uploadToCloudinary(file);
        uploadedImage = uploadedFile.url;
      }

      masterDatabase = await this.findOrCreateMasterDatabase(
        customName!,
        customBrand!,
        customStrength!,
        customWrapper!,
        customSize!,
        uploadedImage,
        customDescription!,
        retailer._id,
      );
    }

    const result = await this.inventoryRepository.create({
      ...rest,
      userId: user._id,
      storeId: retailer._id,
      masterCigarId: masterDatabase._id,
      customName: masterDatabase.name,
      customBrand: masterDatabase.brand,
      customStrength: masterDatabase.strength,
      customWrapper: masterDatabase.wrapper,
      customSize: masterDatabase.size,
      customImage: masterDatabase.image,
      customDescription: masterDatabase.description,
      status: this.resolveStatus(rest.quantity, masterDatabase.status),
    });

    return {
      message: 'Inventory created successfully',
      data: result,
    };
  }

  async updateInventory(
    userId: string,
    inventoryId: string,
    updateInventoryDto: UpdateInventoryDto,
  ) {
    const { retailer } = await this.getRetailerByUserId(userId);

    if (updateInventoryDto.shelfName || updateInventoryDto.humidorId) {
      const inventory = await this.inventoryRepository.findOne({
        _id: inventoryId,
        storeId: retailer._id,
      });
      if (!inventory) throw new HttpException('Inventory not found', 404);

      const humidorId = updateInventoryDto.humidorId ?? inventory.humidorId;
      const shelfName = updateInventoryDto.shelfName ?? inventory.shelfName;
      const humidor = await this.humidorModel.findOne({
        _id: humidorId,
        retailerId: retailer._id,
      });
      if (!humidor) throw new HttpException('Humidor not found', 404);

      const shelf = humidor.shelfes.find(
        (item) => item.name.toLowerCase() === shelfName.trim().toLowerCase(),
      );
      if (!shelf) throw new HttpException('Shelf not found', 404);
    }

    const result = await this.inventoryRepository.findOneAndUpdate(
      { _id: inventoryId, storeId: retailer._id },
      updateInventoryDto,
      { new: true },
    );
    if (!result) throw new HttpException('Inventory not found', 404);

    if (updateInventoryDto.quantity !== undefined) {
      result.status = this.resolveStatus(
        result.quantity,
        undefined,
        result.status,
      );
      await result.save();
    }

    return {
      message: 'Inventory updated successfully',
      data: result,
    };
  }

  async receiveShipment(
    userId: string,
    inventoryId: string,
    receiveShipmentDto: ReceiveShipmentDto,
  ) {
    const { retailer } = await this.getRetailerByUserId(userId);
    const inventory = await this.inventoryRepository.findOne({
      _id: inventoryId,
      storeId: retailer._id,
    });
    if (!inventory) throw new HttpException('Inventory not found', 404);

    inventory.quantity += receiveShipmentDto.quantity;
    inventory.status = this.resolveStatus(
      inventory.quantity,
      undefined,
      inventory.status,
    );
    await inventory.save();

    return {
      message: 'Shipment received successfully',
      data: inventory,
    };
  }
}
