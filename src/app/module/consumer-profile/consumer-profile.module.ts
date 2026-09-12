import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConsumerProfile,
  ConsumerProfileSchema,
} from './entities/consumer-profile.entity';
import { ConsumerProfileController } from './consumer-profile.controller';
import { ConsumerProfileService } from './consumer-profile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsumerProfile.name, schema: ConsumerProfileSchema },
    ]),
  ],
  controllers: [ConsumerProfileController],
  providers: [ConsumerProfileService],
  exports: [ConsumerProfileService],
})
export class ConsumerProfileModule {}
