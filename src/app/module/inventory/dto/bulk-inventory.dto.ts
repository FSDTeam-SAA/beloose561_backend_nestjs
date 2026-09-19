import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsObject,
} from 'class-validator';

// Validate individual cells in the service to report errors by row.
export class BulkInventoryRowDto {
  @ApiProperty() @Allow() upc!: string;
  @ApiProperty() @Allow() quantity!: number | string;
  @ApiProperty() @Allow() price!: number | string;
  @ApiProperty() @Allow() pricePerBox!: number | string;
  @ApiProperty() @Allow() humidor!: string;
  @ApiPropertyOptional() @Allow() wall?: string;
  @ApiProperty() @Allow() shelf!: string;
  @ApiPropertyOptional() @Allow() shelfRow?: number | string;
  @ApiPropertyOptional() @Allow() shelfColumn?: number | string;
  @ApiPropertyOptional({ description: 'Alias for shelfRow' }) @Allow() row?:
    | number
    | string;
  @ApiPropertyOptional({ description: 'Alias for shelfColumn' })
  @Allow()
  column?: number | string;
}

export class BulkInventoryValidateDto {
  @ApiProperty({ type: [BulkInventoryRowDto], maxItems: 2000 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  @IsObject({ each: true })
  rows!: BulkInventoryRowDto[];
}

export class BulkInventoryImportDto extends BulkInventoryValidateDto {}
