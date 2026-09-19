import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConsumerActivity,
  ConsumerActivitySchema,
} from './entities/consumer-activity.entity';
import { ConsumerActivityService } from './consumer-activity.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsumerActivity.name, schema: ConsumerActivitySchema },
    ]),
  ],
  providers: [ConsumerActivityService],
  exports: [ConsumerActivityService],
})
export class ConsumerActivityModule {}
