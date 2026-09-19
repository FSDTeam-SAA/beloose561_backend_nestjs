import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsumerProfileModule } from '../consumer-profile/consumer-profile.module';
import { ConsumerCigarModule } from '../consumer-cigar/consumer-cigar.module';
import { ConsumerActivityModule } from '../consumer-activity/consumer-activity.module';
import { ConsumerCatalogModule } from '../consumer-catalog/consumer-catalog.module';
import { ConsumerScanModule } from '../consumer-scan/consumer-scan.module';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from '../master-database/entities/master-database.entity';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { Journal, JournalSchema } from '../journal/entities/journal.entity';

@Module({
  imports: [
    ConsumerProfileModule,
    ConsumerCigarModule,
    ConsumerActivityModule,
    ConsumerCatalogModule,
    ConsumerScanModule,
    MongooseModule.forFeature([
      { name: Journal.name, schema: JournalSchema },
      { name: MasterDatabase.name, schema: MasterDatabaseSchema },
    ]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
