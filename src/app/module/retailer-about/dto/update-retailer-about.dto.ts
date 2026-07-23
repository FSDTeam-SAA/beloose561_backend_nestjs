import { PartialType } from '@nestjs/swagger';
import { CreateRetailerAboutDto } from './create-retailer-about.dto';

export class UpdateRetailerAboutDto extends PartialType(CreateRetailerAboutDto) {}
