import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CreateInventoryDto } from '../../inventory/dto/create-inventory.dto';

export enum MasterDatabaseStatus {
  ACTIVE = 'active',
  UNDER_REVIEW = 'under_review',
  OUT_OF_STOCK = 'out_of_stock',
  INACTIVE = 'inactive',
}

export class CreateMasterDatabaseDto extends OmitType(CreateInventoryDto, [
  'masterCigarId',
  'humidorId',
  'shelfName',
] as const) {
  @ApiProperty({ example: 'Padron 1964 Natural Toro' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Padron' })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiPropertyOptional({ example: 'Best Connecticut we carry' })
  @IsOptional()
  @IsString()
  staffPickNote?: string;

  @ApiPropertyOptional({ example: 'Mike' })
  @IsOptional()
  @IsString()
  staffPickBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  staffPickAddedAt?: string;

  @ApiPropertyOptional({ example: 'Just arrived' })
  @IsOptional()
  @IsString()
  newArrivalNote?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  autoRemoveDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  newArrivalExpiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  featuredDate?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  featuredPrice?: number;

  @ApiPropertyOptional({ enum: MasterDatabaseStatus })
  @IsOptional()
  @IsEnum(MasterDatabaseStatus)
  status?: MasterDatabaseStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalSearches?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalViews?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalSold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastSoldDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'boolean' ? value : value === 'true',
  )
  @IsBoolean()
  isOnDiscount?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  discountedAt?: string;
}
