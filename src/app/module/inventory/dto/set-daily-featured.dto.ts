import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SetDailyFeaturedDto {
  @ApiPropertyOptional({
    example: '2026-07-08',
    description:
      'Day to feature this cigar for. Defaults to today. The frontend resolves the Today/Tomorrow/Custom Date picker to this ISO date before sending.',
  })
  @IsOptional()
  @IsDateString()
  featuredDate?: string;

  @ApiPropertyOptional({
    example: "Today's special recommendation. Rich and smooth experience.",
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Optional special price while featured',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  featuredPrice?: number;
}
