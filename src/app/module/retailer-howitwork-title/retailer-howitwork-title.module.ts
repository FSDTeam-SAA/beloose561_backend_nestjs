import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetailerHowitworkTitle,
  RetailerHowitworkTitleSchema,
} from './entities/retailer-howitwork-title.entity';
import { RetailerHowitworkTitleController } from './retailer-howitwork-title.controller';
import { RetailerHowitworkTitleService } from './retailer-howitwork-title.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RetailerHowitworkTitle.name,
        schema: RetailerHowitworkTitleSchema,
      },
    ]),
  ],
  controllers: [RetailerHowitworkTitleController],
  providers: [RetailerHowitworkTitleService],
})
export class RetailerHowitworkTitleModule {}
