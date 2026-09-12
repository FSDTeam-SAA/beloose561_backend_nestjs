import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsumerProfile } from './entities/consumer-profile.entity';
import { UpdateConsumerProfileDto } from './dto/update-consumer-profile.dto';

@Injectable()
export class ConsumerProfileService {
  constructor(
    @InjectModel(ConsumerProfile.name)
    private readonly profileModel: Model<ConsumerProfile>,
  ) {}

  getMyProfile(userId: string) {
    return this.profileModel.findOne({ userId }).lean();
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateConsumerProfileDto,
    completeOnboarding = false,
  ) {
    const current = await this.getMyProfile(userId);
    const minBudget = dto.minBudget ?? current?.minBudget;
    const maxBudget = dto.maxBudget ?? current?.maxBudget;
    if (minBudget != null && maxBudget != null && minBudget > maxBudget) {
      throw new BadRequestException('minBudget cannot exceed maxBudget');
    }
    // Onboarding is explicit; a regular profile edit does not reset completion.
    const changes = {
      ...dto,
      ...(completeOnboarding ? { onboardingCompleted: true } : {}),
    };
    return this.profileModel.findOneAndUpdate(
      { userId },
      { $set: changes },
      { new: true, upsert: true, runValidators: true },
    );
  }
}
