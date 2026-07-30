import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/entities/inventory.entity';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import {
  CreateHumidorDto,
  HumidorShelfDto,
  HumidorWallDto,
} from './dto/create-humidor.dto';
import { UpdateHumidorDto } from './dto/update-humidor.dto';
import { UpdateShelfGridDto } from './dto/update-shelf-grid.dto';
import { UpdateWallDto } from './dto/update-wall.dto';
import { Humidor, HumidorDocument } from './entities/humidor.entity';

@Injectable()
export class HumidorService {
  constructor(
    @InjectModel(Humidor.name)
    private readonly humidorModel: Model<HumidorDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Retailer.name) private retailerModel: Model<RetailerDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  async createHumidor(userId: string, createHumidorDto: CreateHumidorDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) {
      throw new HttpException('Retailer not found', 404);
    }
    const humidor = await this.humidorModel.create({
      ...createHumidorDto,
      userId: user._id,
      retailerId: retailer._id,
    });
    if (!user.isHumidor) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { isHumidor: true },
        { new: true },
      );
    }
    return humidor;
  }

  async getMyAllHumidor(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const retailer = await this.retailerModel.findOne({ userId: user._id });
    if (!retailer) {
      throw new HttpException('Retailer not found', 404);
    }
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(
      params,
      ['name', 'location', 'description', 'walls'],
      { userId: user._id, retailerId: retailer._id },
    );
    const result = await this.humidorModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    const total = await this.humidorModel.countDocuments(whereConditions);
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getHumidorById(id: string, userId: string) {
    const result = await this.humidorModel.findOne({ _id: id, userId });
    if (!result) {
      throw new HttpException('Humidor not found', 404);
    }
    return result;
  }

  async addWall(id: string, userId: string, wall: HumidorWallDto) {
    const result = await this.humidorModel.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: {
          walls: {
            _id: new Types.ObjectId(),
            ...wall,
            shelves: (wall.shelves ?? []).map((shelf) => ({
              _id: new Types.ObjectId(),
              ...shelf,
              cigarCount: 0,
            })),
          },
        },
      },
      { new: true },
    );
    if (!result) throw new HttpException('Humidor not found', 404);
    return result;
  }

  async addLegacyShelf(id: string, userId: string, shelf: HumidorShelfDto) {
    if (!shelf.rows || !shelf.columns)
      throw new HttpException('Shelf rows and columns are required', 400);
    const result = await this.humidorModel.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: {
          shelfes: {
            _id: new Types.ObjectId(),
            ...shelf,
            cigarCount: 0,
          },
        },
      },
      { new: true },
    );
    if (!result) throw new HttpException('Humidor not found', 404);
    return result;
  }

  async updateLegacyShelfGrid(
    id: string,
    shelfId: string,
    userId: string,
    grid: UpdateShelfGridDto,
  ) {
    const humidor = await this.humidorModel.findOne({ _id: id, userId });
    const shelf = humidor?.shelfes?.find(
      (item) => String(item._id) === shelfId,
    );
    if (!humidor || !shelf)
      throw new HttpException('Humidor or shelf not found', 404);
    if (
      await this.inventoryModel.exists({
        humidorId: humidor._id,
        shelfName: shelf.name,
        $or: [
          { shelfRow: { $gt: grid.rows } },
          { shelfColumn: { $gt: grid.columns } },
        ],
      })
    )
      throw new HttpException(
        'Move inventory items inside the new grid before reducing its size',
        409,
      );
    return this.humidorModel.findOneAndUpdate(
      { _id: id, userId, 'shelfes._id': shelfId },
      {
        $set: {
          'shelfes.$.rows': grid.rows,
          'shelfes.$.columns': grid.columns,
        },
      },
      { new: true },
    );
  }

  async updateWall(
    id: string,
    wallId: string,
    userId: string,
    update: UpdateWallDto,
  ) {
    const humidor = await this.humidorModel.findOne({ _id: id, userId });
    const wall = humidor?.walls?.find((item) => String(item._id) === wallId);
    if (!humidor || !wall) {
      throw new HttpException('Humidor or wall not found', 404);
    }
    if (
      update.columns &&
      update.columns < wall.columns &&
      (await this.inventoryModel.exists({
        humidorId: humidor._id,
        wallId: wall._id,
        shelfColumn: { $gt: update.columns },
      }))
    ) {
      throw new HttpException(
        'Move inventory items inside the new wall columns before reducing its size',
        409,
      );
    }
    const set = Object.fromEntries(
      Object.entries(update)
        .filter(([key, value]) => key !== 'shelves' && value !== undefined)
        .map(([key, value]) => [`walls.$.${key}`, value]),
    );
    const result = await this.humidorModel.findOneAndUpdate(
      { _id: id, userId, 'walls._id': wallId },
      { $set: set },
      { new: true },
    );
    if (!result) throw new HttpException('Humidor or wall not found', 404);
    return result;
  }

  async addShelf(
    id: string,
    wallId: string,
    userId: string,
    shelf: HumidorShelfDto,
  ) {
    const result = await this.humidorModel.findOneAndUpdate(
      { _id: id, userId, 'walls._id': wallId },
      {
        $push: {
          'walls.$.shelves': {
            _id: new Types.ObjectId(),
            ...shelf,
            cigarCount: 0,
          },
        },
      },
      { new: true },
    );
    if (!result) throw new HttpException('Humidor or wall not found', 404);
    return result;
  }

  async deleteWall(id: string, wallId: string, userId: string) {
    const humidor = await this.humidorModel.findOne({ _id: id, userId });
    const wall = humidor?.walls?.find((item) => String(item._id) === wallId);
    if (!humidor || !wall)
      throw new HttpException('Humidor or wall not found', 404);
    if (
      await this.inventoryModel.exists({
        humidorId: humidor._id,
        wallId: wall._id,
      })
    )
      throw new HttpException(
        'Cannot delete: this wall has inventory items',
        409,
      );
    return this.humidorModel.findOneAndUpdate(
      { _id: id, userId },
      { $pull: { walls: { _id: wall._id } } },
      { new: true },
    );
  }

  async updateHumidor(
    id: string,
    userId: string,
    updateHumidorDto: UpdateHumidorDto,
  ) {
    const result = await this.humidorModel.findOneAndUpdate(
      { _id: id, userId },
      updateHumidorDto,
      { new: true },
    );
    if (!result) {
      throw new HttpException('Humidor not found', 404);
    }
    return result;
  }

  async deleteHumidor(id: string, userId: string) {
    const humidor = await this.humidorModel.findOne({ _id: id, userId });
    if (!humidor) {
      throw new HttpException('Humidor not found', 404);
    }
    const inUse = await this.inventoryModel.exists({ humidorId: humidor._id });
    if (inUse) {
      throw new HttpException(
        'Cannot delete: this humidor has inventory items',
        409,
      );
    }
    const result = await this.humidorModel.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!result) {
      throw new HttpException('Humidor not found', 404);
    }
    return result;
  }
}
