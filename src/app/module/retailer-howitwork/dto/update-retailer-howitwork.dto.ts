import { PartialType } from '@nestjs/swagger';
import { CreateRetailerHowitworkDto } from './create-retailer-howitwork.dto';

export class UpdateRetailerHowitworkDto extends PartialType(CreateRetailerHowitworkDto) {}
