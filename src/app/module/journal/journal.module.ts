import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from '../master-database/entities/master-database.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Journal, JournalSchema } from './entities/journal.entity';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { ConsumerCigarModule } from '../consumer-cigar/consumer-cigar.module';

@Module({
  imports: [
    ConsumerCigarModule,
    MongooseModule.forFeature([
      { name: Journal.name, schema: JournalSchema },
      { name: MasterDatabase.name, schema: MasterDatabaseSchema },
      { name: User.name, schema: UserSchema },
      { name: Retailer.name, schema: RetailerSchema },
    ]),
  ],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule {}
