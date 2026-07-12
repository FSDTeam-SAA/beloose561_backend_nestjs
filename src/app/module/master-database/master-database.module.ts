import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from './entities/master-database.entity';
import { MasterDatabaseController } from './master-database.controller';
import { MasterDatabaseService } from './master-database.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterDatabase.name, schema: MasterDatabaseSchema },
      { name: Retailer.name, schema: RetailerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MasterDatabaseController],
  providers: [MasterDatabaseService],
})
export class MasterDatabaseModule {}
