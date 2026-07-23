import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { CreateRetailerAboutDto } from './dto/create-retailer-about.dto';
import { UpdateRetailerAboutDto } from './dto/update-retailer-about.dto';
import {
  RetailerAbout,
  RetailerAboutDocument,
} from './entities/retailer-about.entity';

@Injectable()
export class RetailerAboutService {
  constructor(
    @InjectModel(RetailerAbout.name)
    private readonly retailerAboutModel: Model<RetailerAboutDocument>,
  ) {}

  async createRetailerAbout(
    createRetailerAboutDto: CreateRetailerAboutDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createRetailerAboutDto.image = uploadedFile.url;
    }

    const result = await this.retailerAboutModel.create(createRetailerAboutDto);
    return result;
  }

  async getAllRetailerAbout(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, [
      'title',
      'description',
      'features',
    ]);

    const result = await this.retailerAboutModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await this.retailerAboutModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getSingleRetailerAbout(id: string) {
    const result = await this.retailerAboutModel.findById(id);
    return result;
  }

  async updateRetailerAbout(
    id: string,
    updateRetailerAboutDto: UpdateRetailerAboutDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateRetailerAboutDto.image = uploadedFile.url;
    }

    const result = await this.retailerAboutModel.findByIdAndUpdate(
      id,
      updateRetailerAboutDto,
      { new: true },
    );
    return result;
  }

  async deleteRetailerAbout(id: string) {
    const result = await this.retailerAboutModel.findByIdAndDelete(id);
    return result;
  }
}
