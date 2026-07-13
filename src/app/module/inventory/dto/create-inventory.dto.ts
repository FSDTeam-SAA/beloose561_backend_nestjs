import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
} from 'class-validator';

export enum CustomCigarStrength {
  MILD = 'mild',
  MEDIUM = 'medium',
  FULL = 'full',
}

// multipart/form-data always sends fields as strings, so an "empty" optional
// field arrives as '' instead of being omitted, and @IsOptional() doesn't skip it.
const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

const ToBoolean = () =>
  Transform(({ value }) => {
    if (value === '' || value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  });

export class CreateInventoryDto {
  @ApiPropertyOptional({
    description:
      'Id of an existing, matched MasterDatabase entry (from the name-suggestion search). When provided, its data is used directly and the custom* fields below are ignored.',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsMongoId()
  masterCigarId?: string;

  @ApiPropertyOptional({
    example: 'Padron 1964 Natural Toro',
    description:
      'Required only when masterCigarId is not provided (no match was selected from the suggestions).',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  customName?: string;

  @ApiPropertyOptional({
    example: 'Padron',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  customBrand?: string;

  @ApiPropertyOptional({
    enum: CustomCigarStrength,
    example: CustomCigarStrength.MEDIUM,
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(CustomCigarStrength)
  customStrength?: CustomCigarStrength;

  @ApiPropertyOptional({ example: 'Natural Colorado' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  customWrapper?: string;

  @ApiPropertyOptional({ example: 'Toro' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  customSize?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  customImage?: string;

  @ApiPropertyOptional({ example: 'A premium handmade Nicaraguan cigar.' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  customDescription?: string;

  @ApiPropertyOptional({
    description: 'Humidor id where this inventory is stored',
  })
  @IsMongoId()
  humidorId!: string;

  @ApiPropertyOptional({
    example: 'Top Shelf',
    description: 'Shelf name within the Humidor where this inventory is placed',
  })
  @IsString()
  @IsNotEmpty()
  shelfName!: string;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ example: 25.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isStaffPick?: boolean;

  @ApiPropertyOptional({ example: 'Best Connecticut we carry' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  staffPickNote?: string;

  @ApiPropertyOptional({ example: 'Mike' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  staffPickBy?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isNewArrival?: boolean;

  @ApiPropertyOptional({ example: '2026-07-13' })
  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isDailyFeatured?: boolean;

  @ApiPropertyOptional({ example: 'Try this with our new bourbon pairing' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  featuredNote?: string;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @EmptyToUndefined()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}
