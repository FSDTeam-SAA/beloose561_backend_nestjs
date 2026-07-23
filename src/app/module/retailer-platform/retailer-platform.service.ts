import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { CreateRetailerPlatformDto } from './dto/create-retailer-platform.dto';
import { UpdateRetailerPlatformDto } from './dto/update-retailer-platform.dto';
import {
  RetailerPlatform,
  RetailerPlatformDocument,
} from './entities/retailer-platform.entity';

@Injectable()
export class RetailerPlatformService {
  constructor(
    @InjectModel(RetailerPlatform.name)
    private readonly retailerPlatformModel: Model<RetailerPlatformDocument>,
  ) {}

  async createRetailerPlatform(
    createRetailerPlatformDto: CreateRetailerPlatformDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createRetailerPlatformDto.image = uploadedFile.url;
    }

    const result = await this.retailerPlatformModel.create(
      createRetailerPlatformDto,
    );
    return result;
  }

  async getAllRetailerPlatform(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, [
      'platformLabel',
      'title',
      'highlightedTitle',
      'description',
      'imageLabel',
      'imageTitle',
      'features.title',
      'features.description',
    ]);

    const result = await this.retailerPlatformModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total =
      await this.retailerPlatformModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getSingleRetailerPlatform(id: string) {
    const result = await this.retailerPlatformModel.findById(id);
    return result;
  }

  async updateRetailerPlatform(
    id: string,
    updateRetailerPlatformDto: UpdateRetailerPlatformDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateRetailerPlatformDto.image = uploadedFile.url;
    }

    const result = await this.retailerPlatformModel.findByIdAndUpdate(
      id,
      updateRetailerPlatformDto,
      { new: true },
    );
    return result;
  }

  async deleteRetailerPlatform(id: string) {
    const result = await this.retailerPlatformModel.findByIdAndDelete(id);
    return result;
  }
}
