import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  buildStoreQrTarget,
  generateAndUploadQrCode,
} from '../../helpers/qrcodeGenerator';
import { Qrcode, QrcodeDocument } from '../qrcodes/entities/qrcode.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';
import { Retailer, RetailerDocument } from './entities/retailer.entity';

@Injectable()
export class RetailerService {
  constructor(
    @InjectModel(Retailer.name) private retailerModel: Model<RetailerDocument>,

    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,

    @InjectModel(Qrcode.name)
    private readonly qrCodeModel: Model<QrcodeDocument>,
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

    const storeUrl = buildStoreQrTarget(retailer.storeSlug);
    const { url: qrCodeUrl } = await generateAndUploadQrCode(storeUrl);

    retailer.qrCodeUrl = qrCodeUrl;
    await retailer.save();

    await this.qrCodeModel.create({
      userId: user._id,
      retailerId: retailer._id,
      qrcodeUrl: qrCodeUrl,
    });

    return retailer;
  }

  async getAllRetailers(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(params, [
      'storeName',
      'email',
      'address',
      'phoneNumber',
      'city',
      'description',
      'storeSlug',
      'status',
    ]);
    const result = await this.retailerModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId');
    const total = await this.retailerModel.countDocuments(whereConditions);
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getRetailerById(id: string) {
    const retailer = await this.retailerModel.findById(id).populate('userId');
    if (!retailer) throw new HttpException('Retailer not found', 404);
    return retailer;
  }

  async updateRetailer(id: string, updateRetailerDto: UpdateRetailerDto) {
    const retailer = await this.retailerModel.findByIdAndUpdate(
      id,
      updateRetailerDto,
      { new: true },
    );
    if (!retailer) throw new HttpException('Retailer not found', 404);
    return retailer;
  }

  async deleteRetailer(id: string) {
    const retailer = await this.retailerModel.findByIdAndDelete(id);
    if (!retailer) throw new HttpException('Retailer not found', 404);
    return retailer;
  }
}
