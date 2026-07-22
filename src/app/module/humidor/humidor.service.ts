import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateHumidorDto, HumidorShelfDto } from './dto/create-humidor.dto';
import { UpdateHumidorDto } from './dto/update-humidor.dto';
import { Humidor, HumidorDocument } from './entities/humidor.entity';

@Injectable()
export class HumidorService {
  constructor(
    @InjectModel(Humidor.name)
    private readonly humidorModel: Model<HumidorDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Retailer.name) private retailerModel: Model<RetailerDocument>,
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
      ['name', 'location', 'description', 'shelfes'],
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

  async addShelf(id: string, userId: string, shelf: HumidorShelfDto) {
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
