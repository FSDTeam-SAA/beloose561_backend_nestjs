import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum CustomCigarStrength {
  MILD = 'mild',
  MILD_MEDIUM = 'mild-medium',
  MEDIUM = 'medium',
  MEDIUM_FULL = 'medium-full',
  FULL = 'full',
}

export const INVENTORY_SMOKING_TIME_OPTIONS = [
  '30',
  '60',
  '90',
  '120+',
] as const;

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

// multipart/form-data sends a single value as a string and repeated values
// as an array, so accept both a comma-separated string and a real array.
const ToStringArray = () =>
  Transform(({ value }) => {
    if (value === '' || value === undefined) return undefined;
    const list = Array.isArray(value) ? value : String(value).split(',');
    return list.map((v) => String(v).trim()).filter(Boolean);
  });

export class CreateInventoryDto {
  @ApiPropertyOptional({
    description:
      'Approved master database cigar id used to prefill product data',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsMongoId()
  masterCigarId?: string;

  @ApiPropertyOptional({
    example: 'Padron 1964 Natural Toro',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Padron',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    enum: CustomCigarStrength,
    example: CustomCigarStrength.MEDIUM,
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(CustomCigarStrength)
  strength?: CustomCigarStrength;

  @ApiPropertyOptional({ example: 'Natural Colorado' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  wrapper?: string;

  @ApiPropertyOptional({ example: 'Toro' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: '60',
    enum: INVENTORY_SMOKING_TIME_OPTIONS,
    description: 'Smoking time in minutes ("120+" for 2+ hours)',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsIn(INVENTORY_SMOKING_TIME_OPTIONS)
  smokingTime?: (typeof INVENTORY_SMOKING_TIME_OPTIONS)[number];

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'A premium handmade Nicaraguan cigar.' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: ['Aged Rum', 'Single Malt Scotch', 'Dark Chocolate'],
    description:
      'Suggested pairings shown under "Perfect Pairings" (comma-separated string or array)',
  })
  @IsOptional()
  @ToStringArray()
  @IsArray()
  @IsString({ each: true })
  pairingSuggestions?: string[];

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

  @ApiPropertyOptional({
    example: 2,
    description: 'Row position inside the selected shelf',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shelfRow!: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Column position inside the selected shelf',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shelfColumn!: number;

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

  @ApiPropertyOptional({ example: 25.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerBox!: number;

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
