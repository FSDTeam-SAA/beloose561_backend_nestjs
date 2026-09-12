import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum MasterDatabaseStatus {
  ACTIVE = 'active',
  UNDER_REVIEW = 'under_review',
  OUT_OF_STOCK = 'out_of_stock',
  INACTIVE = 'inactive',
}

export class CreateMasterDatabaseDto {
  @ApiProperty({ example: 'Gran Reserva — Robusto' })
  @IsString()
  @IsNotEmpty()
  productLine!: string;

  @ApiProperty({ example: 'Arturo Fuente' })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ example: 'Natural' })
  @IsOptional()
  @IsString()
  wrapper?: string;

  @ApiPropertyOptional({ example: '1 Hour' })
  @IsOptional()
  @IsString()
  estimatedSmokingTime?: string;

  @ApiPropertyOptional({ example: ['Cigar + Aged Rum'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pairingSuggestions?: string[];

  @ApiPropertyOptional({ example: 13.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedRetailPriceEach?: number;

  @ApiPropertyOptional({ example: 260.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedRetailPricePerBox?: number;

  @ApiPropertyOptional({
    enum: MasterDatabaseStatus,
    default: MasterDatabaseStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(MasterDatabaseStatus)
  status?: MasterDatabaseStatus;

  @ApiPropertyOptional({
    example: ['0716103012345', '0716103012352'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((code: unknown) =>
          typeof code === 'string' ? code.trim() : code,
        )
      : value,
  )
  upcCodes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  binder?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filler?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavorNotes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whyYoullLikeThis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  length?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  ringGauge?: number;
}
