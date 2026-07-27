import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting, SettingDocument } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  async getSettings() {
    // Atomic get-or-create so two concurrent first-time callers can't end up
    // creating two separate settings documents.
    const result = await this.settingModel.findOneAndUpdate(
      {},
      { $setOnInsert: {} },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return result;
  }

  async updateSettings(updateSettingDto: UpdateSettingDto) {
    const result = await this.settingModel.findOneAndUpdate(
      {},
      { $set: updateSettingDto },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return result;
  }
}
