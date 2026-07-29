import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Humidor, HumidorSchema } from './entities/humidor.entity';
import { HumidorController } from './humidor.controller';
import { HumidorService } from './humidor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Humidor.name, schema: HumidorSchema },
      { name: User.name, schema: UserSchema },
      { name: Retailer.name, schema: RetailerSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [HumidorController],
  providers: [HumidorService],
})
export class HumidorModule {}
