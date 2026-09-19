import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

const numeric = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class UpdateRetailerLocationDto {
  @ApiProperty({ example: 23.8103, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 90.4125, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class NearbyRetailersDto {
  @ApiProperty({ example: 23.8103 })
  @Transform(numeric)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 90.4125 })
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

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(numeric)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Transform(numeric)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
