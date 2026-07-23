import { PartialType } from '@nestjs/swagger';
import { CreateRetailerBannerDto } from './create-retailer-banner.dto';

export class UpdateRetailerBannerDto extends PartialType(CreateRetailerBannerDto) {}
