import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyFeaturedExpiryCronService } from '../../helpers/dailyFeaturedExpiry.cron';
import { NewArrivalExpiryCronService } from '../../helpers/newArrivalExpiry.cron';
import { Humidor, HumidorSchema } from '../humidor/entities/humidor.entity';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from '../master-database/entities/master-database.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Inventory, InventorySchema } from './entities/inventory.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: MasterDatabase.name, schema: MasterDatabaseSchema },
      { name: Humidor.name, schema: HumidorSchema },
      { name: User.name, schema: UserSchema },
      { name: Retailer.name, schema: RetailerSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    NewArrivalExpiryCronService,
    DailyFeaturedExpiryCronService,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
