import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export enum CustomCigarStrength {
  MILD = 'mild',
  MEDIUM = 'medium',
  FULL = 'full',
}

export class CreateInventoryDto {
  @ApiPropertyOptional({
    example: '6a53b6d5eed22f469605a612',
    description:
      'Select an existing cigar from MasterDatabase. If provided, custom* fields are not required.',
  })
  @IsOptional()
  @IsMongoId()
  masterCigarId?: string;

  @ApiPropertyOptional({
    example: 'Padron 1964 Natural Toro',
    description:
      'Required only when masterCigarId is not provided. If this matches an existing MasterDatabase entry, that entry data is used; otherwise a new MasterDatabase submission is created.',
  })
  @ValidateIf((inventory: CreateInventoryDto) => !inventory.masterCigarId)
  @IsString()
  @IsNotEmpty()
  customName?: string;

  @ApiPropertyOptional({
    example: 'Padron',
    description:
      'Required only when masterCigarId is not provided. Used to submit a new MasterDatabase entry when customName is not found.',
  })
  @ValidateIf((inventory: CreateInventoryDto) => !inventory.masterCigarId)
  @IsString()
  @IsNotEmpty()
  customBrand?: string;

  @ApiPropertyOptional({
    enum: CustomCigarStrength,
    example: CustomCigarStrength.MEDIUM,
  })
  @IsOptional()
  @IsEnum(CustomCigarStrength)
  customStrength?: CustomCigarStrength;

  @ApiPropertyOptional({ example: 'Natural Colorado' })
  @IsOptional()
  @IsString()
  customWrapper?: string;

  @ApiPropertyOptional({ example: 'Toro' })
  @IsOptional()
  @IsString()
  customSize?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  customImage?: string;

  @ApiPropertyOptional({ example: 'A premium handmade Nicaraguan cigar.' })
  @IsOptional()
  @IsString()
  customDescription?: string;

  @ApiProperty({ description: 'Humidor id where this inventory is stored' })
  @IsMongoId()
  humidorId!: string;

  @ApiProperty({
    example: 'Top Shelf',
    description: 'Shelf name within the Humidor where this inventory is placed',
  })
  @IsString()
  @IsNotEmpty()
  shelfName!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ example: 25.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isStaffPick?: boolean;

  @ApiPropertyOptional({ example: 'Best Connecticut we carry' })
  @IsOptional()
  @IsString()
  staffPickNote?: string;

  @ApiPropertyOptional({ example: 'Mike' })
  @IsOptional()
  @IsString()
  staffPickBy?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @ApiPropertyOptional({ example: '2026-07-13' })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDailyFeatured?: boolean;

  @ApiPropertyOptional({ example: 'Try this with our new bourbon pairing' })
  @IsOptional()
  @IsString()
  featuredNote?: string;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}
