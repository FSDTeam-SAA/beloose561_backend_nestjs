import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { CreateRetailerBenefitDto } from './dto/create-retailer-benefit.dto';
import { UpdateRetailerBenefitDto } from './dto/update-retailer-benefit.dto';
import {
  RetailerBenefit,
  RetailerBenefitDocument,
} from './entities/retailer-benefit.entity';

@Injectable()
export class RetailerBenefitsService {
  constructor(
    @InjectModel(RetailerBenefit.name)
    private readonly retailerBenefitModel: Model<RetailerBenefitDocument>,
  ) {}

  async createRetailerBenefit(
    createRetailerBenefitDto: CreateRetailerBenefitDto,
    files?: Express.Multer.File[],
  ) {
    if (files?.length) {
      const uploadedFiles = await Promise.all(
        files.map((file) => fileUpload.uploadToCloudinary(file)),
      );
      createRetailerBenefitDto.images = uploadedFiles.map((file) => file.url);
    }

    const result = await this.retailerBenefitModel.create(
      createRetailerBenefitDto,
    );
    return result;
  }

  async findAllRetailerBenefits(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, ['title', 'subTitle']);

    const result = await this.retailerBenefitModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total =
      await this.retailerBenefitModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async findOneRetailerBenefit(id: string) {
    const result = await this.retailerBenefitModel.findById(id);
    return result;
  }

  async updateRetailerBenefit(
    id: string,
    updateRetailerBenefitDto: UpdateRetailerBenefitDto,
    files?: Express.Multer.File[],
  ) {
    if (files?.length) {
      const uploadedFiles = await Promise.all(
        files.map((file) => fileUpload.uploadToCloudinary(file)),
      );
      updateRetailerBenefitDto.images = uploadedFiles.map((file) => file.url);
    }

    const result = await this.retailerBenefitModel.findByIdAndUpdate(
      id,
      updateRetailerBenefitDto,
      { new: true },
    );
    return result;
  }

  async removeRetailerBenefit(id: string) {
    const result = await this.retailerBenefitModel.findByIdAndDelete(id);
    return result;
  }
}
