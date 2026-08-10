import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { CreateRetailerHowitworkTitleDto } from './dto/create-retailer-howitwork-title.dto';
import { UpdateRetailerHowitworkTitleDto } from './dto/update-retailer-howitwork-title.dto';
import { RetailerHowitworkTitle } from './entities/retailer-howitwork-title.entity';

@Injectable()
export class RetailerHowitworkTitleService {
  constructor(
    @InjectModel(RetailerHowitworkTitle.name)
    private readonly retailerHowitworkTitleModel: Model<RetailerHowitworkTitle>,
  ) {}

  async createHowitworkTitle(
    createRetailerHowitworkTitleDto: CreateRetailerHowitworkTitleDto,
  ) {
    const result = await this.retailerHowitworkTitleModel.create(
      createRetailerHowitworkTitleDto,
    );
    return result;
  }

  async findAllHowitworkTitle(params: IFilterParams, options: IOptions) {
    const { skip, limit, page, sortBy, sortOrder } = paginationHelper(options);
    const whenConditation = buildWhereConditions(params, ['title']);
    const result = await this.retailerHowitworkTitleModel
      .find(whenConditation)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .exec();
    const total =
      await this.retailerHowitworkTitleModel.countDocuments(whenConditation);
    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleHowitworkTitle(id: string) {
    const result = await this.retailerHowitworkTitleModel.findById(id);
    if (!result)
      throw new HttpException('HowitworkTitle not found', HttpStatus.NOT_FOUND);
    return result;
  }

  async updateHowitworkTitle(
    id: string,
    updateRetailerHowitworkTitleDto: UpdateRetailerHowitworkTitleDto,
  ) {
    const result = await this.retailerHowitworkTitleModel.findByIdAndUpdate(
      id,
      updateRetailerHowitworkTitleDto,
      { new: true },
    );
    if (!result)
      throw new HttpException('HowitworkTitle not found', HttpStatus.NOT_FOUND);
    return result;
  }

  async removeHowitworkTitle(id: string) {
    const result = await this.retailerHowitworkTitleModel.findByIdAndDelete(id);
    if (!result)
      throw new HttpException('HowitworkTitle not found', HttpStatus.NOT_FOUND);
    return result;
  }
}
