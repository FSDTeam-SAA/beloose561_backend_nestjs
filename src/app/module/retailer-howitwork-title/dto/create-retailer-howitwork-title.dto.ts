import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRetailerHowitworkTitleDto {
  @ApiPropertyOptional({ example: 'Retailer How It Works Title' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;
}
