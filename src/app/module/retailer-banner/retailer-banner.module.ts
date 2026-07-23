import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetailerBanner,
  RetailerBannerSchema,
} from './entities/retailer-banner.entity';
import { RetailerBannerController } from './retailer-banner.controller';
import { RetailerBannerService } from './retailer-banner.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetailerBanner.name, schema: RetailerBannerSchema },
    ]),
  ],
  controllers: [RetailerBannerController],
  providers: [RetailerBannerService],
})
export class RetailerBannerModule {}
