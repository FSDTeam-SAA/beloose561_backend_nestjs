import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export const AUTO_REMOVE_DAYS_OPTIONS = [7, 14, 30] as const;

export class MarkNewArrivalDto {
  @ApiPropertyOptional({
    example: '2026-07-08',
    description: 'Defaults to today if omitted',
  })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({
    example: 'Just arrived from Davidoff. Limited quantity available.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: 30,
    enum: AUTO_REMOVE_DAYS_OPTIONS,
    default: 30,
    description: 'Auto-remove from New Arrivals after this many days',
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn(AUTO_REMOVE_DAYS_OPTIONS)
  autoRemoveDays?: number;
}
