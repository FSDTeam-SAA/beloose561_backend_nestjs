import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { AUTO_REMOVE_DAYS_OPTIONS } from './mark-new-arrival.dto';

export class UpdateNewArrivalDto {
  @ApiPropertyOptional({ example: '2026-07-08' })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({
    example: 'Just arrived from Davidoff. Limited quantity available.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 30, enum: AUTO_REMOVE_DAYS_OPTIONS })
  @IsOptional()
  @Type(() => Number)
  @IsIn(AUTO_REMOVE_DAYS_OPTIONS)
  autoRemoveDays?: number;
}
