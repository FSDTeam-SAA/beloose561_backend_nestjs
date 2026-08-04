import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { CreateContactInfoDto } from './dto/create-contact-info.dto';
import { ContactInfoDocument } from './entities/contact-info.entity';

@Injectable()
export class ContactInfoService {
  constructor(
    @InjectModel('ContactInfo')
    private contactInfoModel: Model<ContactInfoDocument>,
  ) {}

  async createContactInfo(contactInfo: CreateContactInfoDto) {
    const result = await this.contactInfoModel.create(contactInfo);
    return result;
  }

  async getAllContactInfo(params: IFilterParams, options: IOptions) {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(params, [
      'email',
      'phone',
      'address',
    ]);
    const result = await this.contactInfoModel
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });
    const total = await this.contactInfoModel.countDocuments(whereConditions);
    return {
      data: result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getContactInfo(id: string) {
    const result = await this.contactInfoModel.findById(id);
    if (!result) {
      throw new HttpException('Contact info not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async updateContactInfo(id: string, contactInfo: CreateContactInfoDto) {
    const result = await this.contactInfoModel.findByIdAndUpdate(
      id,
      contactInfo,
      { new: true },
    );
    if (!result) {
      throw new HttpException('Contact info not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async deleteContactInfo(id: string) {
    const result = await this.contactInfoModel.findByIdAndDelete(id);
    if (!result) {
      throw new HttpException('Contact info not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}
