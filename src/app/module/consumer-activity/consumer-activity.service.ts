import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActivityType,
  ConsumerActivity,
} from './entities/consumer-activity.entity';

@Injectable()
export class ConsumerActivityService {
  constructor(
    @InjectModel(ConsumerActivity.name)
    private readonly activityModel: Model<ConsumerActivity>,
  ) {}

  record(
    userId: string,
    type: ActivityType,
    data: {
      cigarId?: string;
      retailerId?: string;
      rating?: number;
      searchTerm?: string;
      journalId?: string;
      flavorTags?: string[];
      strengthImpression?: string;
      wouldSmokeAgain?: boolean;
    } = {},
  ) {
    return this.activityModel.create({ userId, type, ...data });
  }

  getRecentActivity(userId: string) {
    return this.activityModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }
}
