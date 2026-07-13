import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import { fileUpload } from '../../helpers/fileUploder';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { IFilterParams } from '../../helpers/pick';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateMasterDatabaseDto } from './dto/create-master-database.dto';
import { UpdateMasterDatabaseDto } from './dto/update-master-database.dto';
import {
  MasterDatabase,
  MasterDatabaseDocument,
} from './entities/master-database.entity';

@Injectable()
export class MasterDatabaseService {
  constructor(
    @InjectModel(MasterDatabase.name)
    private readonly masterBatabaseModel: Model<MasterDatabaseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Retailer.name) private retailerModel: Model<RetailerDocument>,
  ) {}

  async createMasterDatabase(
    createMasterDatabaseDto: CreateMasterDatabaseDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createMasterDatabaseDto.image = uploadedFile.url;
    }
    const masterDatabase = await this.masterBatabaseModel.create(
      createMasterDatabaseDto,
    );

    return masterDatabase;
  }

  async getAllMasterDatabase(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, [
      'name',
      'brand',
      'productLine',
      'manufacturer',
      'country',
      'wrapper',
      'binder',
      'filler',
      'strength',
      'size',
      'length',
      'flavorNotes',
      'smokingTime',
      'description',
      'whyYoullLikeThis',
      'status',
    ]);

    const result = await this.masterBatabaseModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total =
      await this.masterBatabaseModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getMasterDatabaseById(id: string) {
    const masterDatabase = await this.masterBatabaseModel.findById(id);
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async updateMasterDatabaseById(
    id: string,
    updateMasterDatabaseDto: UpdateMasterDatabaseDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      updateMasterDatabaseDto.image = uploadedFile.url;
    }
    const masterDatabase = await this.masterBatabaseModel.findByIdAndUpdate(
      id,
      updateMasterDatabaseDto,
      { new: true },
    );
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }

  async deleteMasterDatabaseById(id: string) {
    const masterDatabase = await this.masterBatabaseModel.findByIdAndDelete(id);
    if (!masterDatabase) throw new HttpException('not found', 404);
    return masterDatabase;
  }
}
