import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetailerAbout,
  RetailerAboutSchema,
} from './entities/retailer-about.entity';
import { RetailerAboutController } from './retailer-about.controller';
import { RetailerAboutService } from './retailer-about.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetailerAbout.name, schema: RetailerAboutSchema },
    ]),
  ],
  controllers: [RetailerAboutController],
  providers: [RetailerAboutService],
})
export class RetailerAboutModule {}
