import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum StrengthPreference {
  MILD = 'mild',
  MEDIUM = 'medium',
  FULL = 'full',
}

export enum NewOrFamiliarPreference {
  FAMILIAR = 'familiar',
  NEW = 'new',
}

export const SMOKING_TIME_OPTIONS = ['30', '60', '90', '120+'] as const;

export class GuidedDiscoveryDto {
  @ApiPropertyOptional({ enum: StrengthPreference, example: 'medium' })
  @IsOptional()
  @IsEnum(StrengthPreference)
  strength?: StrengthPreference;

  @ApiPropertyOptional({ example: 15, description: 'Budget range - low end' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @ApiPropertyOptional({ example: 25, description: 'Budget range - high end' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @ApiPropertyOptional({
    example: '60',
    enum: SMOKING_TIME_OPTIONS,
    description: 'Preferred smoking time in minutes ("120+" for 2+ hours)',
  })
  @IsOptional()
  @IsIn(SMOKING_TIME_OPTIONS)
  smokingTime?: (typeof SMOKING_TIME_OPTIONS)[number];

  @ApiPropertyOptional({ example: 'Natural' })
  @IsOptional()
  @IsString()
  wrapperPreference?: string;

  @ApiPropertyOptional({ enum: NewOrFamiliarPreference, example: 'familiar' })
  @IsOptional()
  @IsEnum(NewOrFamiliarPreference)
  preference?: NewOrFamiliarPreference;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
