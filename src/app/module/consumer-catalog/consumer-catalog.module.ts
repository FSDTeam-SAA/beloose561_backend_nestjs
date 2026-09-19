import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from '../master-database/entities/master-database.entity';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { Humidor, HumidorSchema } from '../humidor/entities/humidor.entity';
import { ConsumerScanModule } from '../consumer-scan/consumer-scan.module';
import { ConsumerCigarModule } from '../consumer-cigar/consumer-cigar.module';
import { ConsumerActivityModule } from '../consumer-activity/consumer-activity.module';
import { ConsumerCatalogService } from './consumer-catalog.service';
import { ConsumerCatalogController } from './consumer-catalog.controller';

@Module({
  imports: [
    ConsumerScanModule,
    ConsumerCigarModule,
    ConsumerActivityModule,
    MongooseModule.forFeature([
      { name: MasterDatabase.name, schema: MasterDatabaseSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Retailer.name, schema: RetailerSchema },
      { name: Humidor.name, schema: HumidorSchema },
    ]),
  ],
  controllers: [ConsumerCatalogController],
  providers: [ConsumerCatalogService],
  exports: [ConsumerCatalogService],
})
export class ConsumerCatalogModule {}
