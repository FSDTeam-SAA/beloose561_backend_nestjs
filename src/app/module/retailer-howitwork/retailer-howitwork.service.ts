import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import { CreateRetailerHowitworkDto } from './dto/create-retailer-howitwork.dto';
import { UpdateRetailerHowitworkDto } from './dto/update-retailer-howitwork.dto';
import {
  RetailerHowitwork,
  RetailerHowitworkDocument,
} from './entities/retailer-howitwork.entity';

@Injectable()
export class RetailerHowitworkService {
  constructor(
    @InjectModel(RetailerHowitwork.name)
    private readonly retailerHowitworkModel: Model<RetailerHowitworkDocument>,
  ) {}

  async createRetailerHowitwork(
    createRetailerHowitworkDto: CreateRetailerHowitworkDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createRetailerHowitworkDto.image = uploadedFile.url;
    }
    const result = await this.retailerHowitworkModel.create(
      createRetailerHowitworkDto,
    );

    return result;
  }

  async findAllRetailerHowitworks(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whenConditation = buildWhereConditions(params, [
      'title',
      'description',
    ]);

    const result = await this.retailerHowitworkModel
      .find(whenConditation)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total =
      await this.retailerHowitworkModel.countDocuments(whenConditation);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async findOneRetailerHowitwork(id: string) {
    const result = await this.retailerHowitworkModel.findById(id).exec();
    if (!result) {
      throw new HttpException('RetailerHowitwork not found', 404);
    }
    return result;
  }

  async updateRetailerHowitwork(
    id: string,
    updateRetailerHowitworkDto: UpdateRetailerHowitworkDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateRetailerHowitworkDto.image = uploadedFile.url;
    }
    const result = await this.retailerHowitworkModel.findByIdAndUpdate(
      id,
      updateRetailerHowitworkDto,
      { new: true },
    );
    if (!result) {
      throw new HttpException('RetailerHowitwork not found', 404);
    }
    return result;
  }

  async removeRetailerHowitwork(id: string) {
    const result = await this.retailerHowitworkModel.findByIdAndDelete(id);
    if (!result) {
      throw new HttpException('RetailerHowitwork not found', 404);
    }
    return result;
  }
}
