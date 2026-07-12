import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum CigarStrength {
  MILD = 'mild',
  MEDIUM = 'medium',
  FULL = 'full',
}

export enum MasterDatabaseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
}

export class CreateMasterDatabaseDto {
  @ApiProperty({
    example: 'Padron 1964 Natural Toro',
    description: 'Cigar name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Padron',
    description: 'Brand name',
  })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiPropertyOptional({
    example: '1964 Anniversary',
  })
  @IsOptional()
  @IsString()
  productLine?: string;

  @ApiPropertyOptional({
    example: 'Padron Cigars',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({
    example: 'Nicaragua',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 'Natural Colorado',
  })
  @IsOptional()
  @IsString()
  wrapper?: string;

  @ApiPropertyOptional({
    example: 'Nicaraguan',
  })
  @IsOptional()
  @IsString()
  binder?: string;

  @ApiPropertyOptional({
    example: 'Nicaraguan',
  })
  @IsOptional()
  @IsString()
  filler?: string;

  @ApiPropertyOptional({
    enum: CigarStrength,
    example: CigarStrength.MEDIUM,
  })
  @IsOptional()
  @IsEnum(CigarStrength)
  strength?: CigarStrength;

  @ApiPropertyOptional({
    example: 'Toro',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: 52,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ringGauge?: number;

  @ApiPropertyOptional({
    example: '6.5 inches',
  })
  @IsOptional()
  @IsString()
  length?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Chocolate', 'Coffee', 'Earth'],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((item: string) => item.trim())
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  flavorNotes?: string[];

  @ApiPropertyOptional({
    example: '60-75 minutes',
  })
  @IsOptional()
  @IsString()
  smokingTime?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    example: 'A premium handmade Nicaraguan cigar.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Perfect balance of chocolate, coffee and cedar notes.',
  })
  @IsOptional()
  @IsString()
  whyYoullLikeThis?: string;

  @ApiPropertyOptional({
    example: '$20 - $30',
  })
  @IsOptional()
  @IsString()
  priceRange?: string;

  @ApiPropertyOptional({
    enum: MasterDatabaseStatus,
    default: MasterDatabaseStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(MasterDatabaseStatus)
  status?: MasterDatabaseStatus;
}
