import { PartialType } from '@nestjs/swagger';
import { CreateRetailerPlatformDto } from './create-retailer-platform.dto';

export class UpdateRetailerPlatformDto extends PartialType(
  CreateRetailerPlatformDto,
) {}
