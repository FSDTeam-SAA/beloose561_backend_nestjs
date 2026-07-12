import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { Retailer, RetailerDocument } from './entities/retailer.entity';

@Injectable()
export class RetailerService {
  constructor(
    @InjectModel(Retailer.name) private retailerModel: Model<RetailerDocument>,

    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createRetailer(userId: string, createRetailerDto: CreateRetailerDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const slage = createRetailerDto.storeName
      .replace(/\s+/g, '-')
      .toLowerCase();
    const retailer = await this.retailerModel.create({
      ...createRetailerDto,
      userId: user._id,
      storeSlug: slage,
    });
    return retailer;
  }
}
