import { PartialType } from '@nestjs/swagger';
import { CreateRetailerBenefitDto } from './create-retailer-benefit.dto';

export class UpdateRetailerBenefitDto extends PartialType(CreateRetailerBenefitDto) {}
