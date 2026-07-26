import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RetailerBenefit,
  RetailerBenefitSchema,
} from './entities/retailer-benefit.entity';
import { RetailerBenefitsController } from './retailer-benefits.controller';
import { RetailerBenefitsService } from './retailer-benefits.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetailerBenefit.name, schema: RetailerBenefitSchema },
    ]),
  ],
  controllers: [RetailerBenefitsController],
  providers: [RetailerBenefitsService],
})
export class RetailerBenefitsModule {}
