import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetailerPlatform,
  RetailerPlatformSchema,
} from './entities/retailer-platform.entity';
import { RetailerPlatformController } from './retailer-platform.controller';
import { RetailerPlatformService } from './retailer-platform.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetailerPlatform.name, schema: RetailerPlatformSchema },
    ]),
  ],
  controllers: [RetailerPlatformController],
  providers: [RetailerPlatformService],
})
export class RetailerPlatformModule {}
