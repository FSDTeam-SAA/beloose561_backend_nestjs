import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Humidor, HumidorSchema } from '../humidor/entities/humidor.entity';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { MasterDatabaseModule } from '../master-database/master-database.module';
import { ConsumerScanController } from './consumer-scan.controller';
import { ConsumerScanService } from './consumer-scan.service';
import { ConsumerActivityModule } from '../consumer-activity/consumer-activity.module';

@Module({
  imports: [
    ConsumerActivityModule,
    MasterDatabaseModule,
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: Retailer.name, schema: RetailerSchema },
      { name: Humidor.name, schema: HumidorSchema },
    ]),
  ],
  controllers: [ConsumerScanController],
  providers: [ConsumerScanService],
  exports: [ConsumerScanService],
})
export class ConsumerScanModule {}
