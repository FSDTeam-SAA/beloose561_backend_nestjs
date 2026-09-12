import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCigar } from './entities/user-cigar.entity';
import { MasterDatabase } from '../master-database/entities/master-database.entity';
import { ConsumerActivityService } from '../consumer-activity/consumer-activity.service';
import { MyCigarsQueryDto } from './dto/consumer-cigar.dto';

@Injectable()
export class ConsumerCigarService {
  constructor(
    @InjectModel(UserCigar.name)
    private readonly userCigarModel: Model<UserCigar>,
    @InjectModel(MasterDatabase.name)
    private readonly masterDatabaseModel: Model<MasterDatabase>,
    private readonly activityService: ConsumerActivityService,
  ) {}

  getUserState(userId: string, cigarId: string) {
    return this.userCigarModel.findOne({ userId, cigarId }).lean();
  }

  getAllUserStates(userId: string) {
    return this.userCigarModel.find({ userId }).lean();
  }

  async getMyCigars(userId: string, query: MyCigarsQueryDto) {
    const filter: Record<string, unknown> = { userId };
    if (query.type === 'favorites') filter.isFavorite = true;
    if (query.type === 'want-to-try') filter.wantToTry = true;
    if (query.type === 'smoked') filter.hasSmoked = true;
    const data = await this.userCigarModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('cigarId', 'brand productLine name image strength wrapper')
      .lean();
    const total = await this.userCigarModel.countDocuments(filter);
    return { data, meta: { page: query.page, limit: query.limit, total } };
  }

  async setPreference(
    userId: string,
    cigarId: string,
    field: 'isFavorite' | 'wantToTry' | 'hasSmoked',
    enabled: boolean,
  ) {
    await this.ensureCigarExists(cigarId);
    const changes = {
      [field]: enabled,
      ...(field === 'hasSmoked' ? { lastSmokedAt: new Date() } : {}),
    };
    const result = await this.userCigarModel.findOneAndUpdate(
      { userId, cigarId },
      { $set: changes },
      { new: true, upsert: true, runValidators: true },
    );
    const type =
      field === 'isFavorite'
        ? enabled
          ? 'favorite'
          : 'unfavorite'
        : field === 'wantToTry'
          ? enabled
            ? 'want_to_try'
            : 'remove_want_to_try'
          : 'smoked';
    await this.activityService.record(userId, type, { cigarId });
    return result;
  }

  async rateCigar(userId: string, cigarId: string, rating: number) {
    await this.ensureCigarExists(cigarId);
    const result = await this.userCigarModel.findOneAndUpdate(
      { userId, cigarId },
      { $set: { rating } },
      { new: true, upsert: true, runValidators: true },
    );
    await this.activityService.record(userId, 'rating', { cigarId, rating });
    return result;
  }

  private async ensureCigarExists(cigarId: string) {
    const cigar = await this.masterDatabaseModel.exists({
      _id: cigarId,
      status: 'active',
    });
    if (!cigar) throw new NotFoundException('Active cigar not found');
  }
}
