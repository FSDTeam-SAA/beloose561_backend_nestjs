import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from '../master-database/entities/master-database.entity';
import { ConsumerActivityModule } from '../consumer-activity/consumer-activity.module';
import { UserCigar, UserCigarSchema } from './entities/user-cigar.entity';
import { ConsumerCigarService } from './consumer-cigar.service';
import { ConsumerCigarController } from './consumer-cigar.controller';

@Module({
  imports: [
    ConsumerActivityModule,
    MongooseModule.forFeature([
      { name: UserCigar.name, schema: UserCigarSchema },
      { name: MasterDatabase.name, schema: MasterDatabaseSchema },
    ]),
  ],
  controllers: [ConsumerCigarController],
  providers: [ConsumerCigarService],
  exports: [ConsumerCigarService],
})
export class ConsumerCigarModule {}
