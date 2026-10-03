import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CatalogQueryDto } from './catalog-query.dto';

const numeric = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class NearbyCatalogQueryDto extends OmitType(CatalogQueryDto, [
  'retailerId',
] as const) {
  @ApiProperty({ example: 23.8103, minimum: -90, maximum: 90 })
  @Transform(numeric)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 90.4125, minimum: -180, maximum: 180 })
  @Transform(numeric)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiPropertyOptional({
    default: 5000,
    description: 'Radius in meters (maximum 100 km)',
  })
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(1)
  @Max(100000)
  radius = 5000;
}

export class NearbyStockQueryDto {
  @ApiProperty({ example: 23.8103, minimum: -90, maximum: 90 })
  @Transform(numeric)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 90.4125, minimum: -180, maximum: 180 })
  @Transform(numeric)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiPropertyOptional({
    default: 10000,
    description: 'Radius in meters (maximum 100 km)',
  })
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(1)
  @Max(100000)
  radius = 10000;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(numeric)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Transform(numeric)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
