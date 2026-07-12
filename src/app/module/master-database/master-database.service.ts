import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateMasterDatabaseDto } from './dto/create-master-database.dto';
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
}
