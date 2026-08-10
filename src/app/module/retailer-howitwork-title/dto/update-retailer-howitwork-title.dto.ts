import { PartialType } from '@nestjs/swagger';
import { CreateRetailerHowitworkTitleDto } from './create-retailer-howitwork-title.dto';

export class UpdateRetailerHowitworkTitleDto extends PartialType(CreateRetailerHowitworkTitleDto) {}
