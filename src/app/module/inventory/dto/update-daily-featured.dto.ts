import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateDailyFeaturedDto {
  @ApiPropertyOptional({ example: '2026-07-08' })
  @IsOptional()
  @IsDateString()
  featuredDate?: string;

  @ApiPropertyOptional({
    example: "Today's special recommendation. Rich and smooth experience.",
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  featuredPrice?: number;
}
