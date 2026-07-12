import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateRetailerDto } from './create-retailer.dto';

export class UpdateRetailerDto extends PartialType(CreateRetailerDto) {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  logo?: string;
}
