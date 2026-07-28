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

  @ApiProperty({
    example: 1,
    minimum: 1,
    description: 'Number of rows available inside the shelf',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  rows!: number;

  @ApiProperty({
    example: 1,
    minimum: 1,
    description: 'Number of columns available inside the shelf',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  columns!: number;
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

  @ApiPropertyOptional({
    type: () => [HumidorShelfDto],
    description: 'List of shelfes',
    required: false,
    example: [
      {
        name: 'Top Shelf',
        description: 'Premium Cigars',
        rows: 5,
        columns: 4,
      },
      {
        name: 'Middle Shelf',
        description: 'Medium Range Cigars',
        rows: 3,
        columns: 6,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HumidorShelfDto)
  shelfes?: HumidorShelfDto[];

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Humidor active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
