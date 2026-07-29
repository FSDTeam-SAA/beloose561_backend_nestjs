import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
  @ApiPropertyOptional({ example: 'Gran Reserva — Robusto' })
  @IsString()
  @IsNotEmpty()
  productLine!: string;

  @ApiPropertyOptional({ example: 'Arturo Fuente' })
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
}
