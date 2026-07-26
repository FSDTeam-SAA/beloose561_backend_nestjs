import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetailerHowitwork,
  RetailerHowitworkSchema,
} from './entities/retailer-howitwork.entity';
import { RetailerHowitworkController } from './retailer-howitwork.controller';
import { RetailerHowitworkService } from './retailer-howitwork.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetailerHowitwork.name, schema: RetailerHowitworkSchema },
    ]),
  ],
  controllers: [RetailerHowitworkController],
  providers: [RetailerHowitworkService],
})
export class RetailerHowitworkModule {}
