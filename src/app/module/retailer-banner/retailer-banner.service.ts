import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { CreateRetailerBannerDto } from './dto/create-retailer-banner.dto';
import {
  RetailerBanner,
  RetailerBannerDocument,
} from './entities/retailer-banner.entity';

@Injectable()
export class RetailerBannerService {
  constructor(
    @InjectModel(RetailerBanner.name)
    private readonly retailerBannerModel: Model<RetailerBannerDocument>,
  ) {}

  async createRetailerBanner(
    createRetailerBannerDto: CreateRetailerBannerDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createRetailerBannerDto.banner = uploadedFile.url;
    }
    const result = await this.retailerBannerModel.create(
      createRetailerBannerDto,
    );
    return result;
  }

  async getAllRetailerBanner(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, [
      'title',
      'description',
      'mainTitle',
    ]);
    const result = await this.retailerBannerModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total =
      await this.retailerBannerModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getSingleRetailerBanner(id: string) {
    const result = await this.retailerBannerModel.findById(id);
    return result;
  }

  async updateRetailerBanner(
    id: string,
    createRetailerBannerDto: CreateRetailerBannerDto,
    file?: Express.Multer.File,
  ) {
    const sanitizedUpdatePayload: Partial<CreateRetailerBannerDto> = {};

    if (typeof createRetailerBannerDto.title === 'string') {
      sanitizedUpdatePayload.title = createRetailerBannerDto.title;
    }
    if (typeof createRetailerBannerDto.discription === 'string') {
      sanitizedUpdatePayload.discription = createRetailerBannerDto.discription;
    }
    if (typeof createRetailerBannerDto.mainTitle === 'string') {
      sanitizedUpdatePayload.mainTitle = createRetailerBannerDto.mainTitle;
    }
    if (typeof createRetailerBannerDto.banner === 'string') {
      sanitizedUpdatePayload.banner = createRetailerBannerDto.banner;
    }

    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      sanitizedUpdatePayload.banner = uploadedFile.url;
    }

    const result = await this.retailerBannerModel.findByIdAndUpdate(
      id,
      sanitizedUpdatePayload,
      { new: true },
    );
    return result;
  }

  async deleteRetailerBanner(id: string) {
    const result = await this.retailerBannerModel.findByIdAndDelete(id);
    return result;
  }
}
