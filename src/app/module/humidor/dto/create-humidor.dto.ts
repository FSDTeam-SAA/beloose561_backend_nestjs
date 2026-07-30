import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class HumidorShelfDto {
  @ApiProperty({
    example: 'Top Shelf',
    description: 'Shelf name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Premium Cigars',
    description: 'Shelf description',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description: 'Legacy shelf-grid row count',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  rows?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description: 'Legacy shelf-grid column count',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  columns?: number;
}

export class HumidorWallDto {
  @ApiProperty({ example: 'Wall 1', description: 'Wall name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Left wall' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  columns!: number;

  @ApiPropertyOptional({ type: () => [HumidorShelfDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HumidorShelfDto)
  shelves?: HumidorShelfDto[];
}

export class CreateHumidorDto {
  @ApiProperty({
    example: 'Main Humidor',
    description: 'Humidor name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Front of Store',
    description: 'Humidor location',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiPropertyOptional({
    example: 'Temperature Controlled Humidor',
    description: 'Humidor description',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ type: () => [HumidorWallDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HumidorWallDto)
  walls?: HumidorWallDto[];

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Humidor active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
