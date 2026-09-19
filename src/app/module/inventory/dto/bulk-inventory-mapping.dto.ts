import { BadRequestException } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';

export const BULK_INVENTORY_FIELDS = [
  'upc',
  'quantity',
  'price',
  'pricePerBox',
  'shelfRow',
  'shelfColumn',
  'humidor',
  'wall',
  'shelf',
  'row',
  'column',
] as const;

export type BulkInventoryField = (typeof BULK_INVENTORY_FIELDS)[number];

export class BulkInventoryMappingDto {
  @ApiPropertyOptional({
    description: 'JSON object mapping spreadsheet headers to inventory fields',
    example: { Barcode: 'upc', Qty: 'quantity', 'Retail Price': 'price' },
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      throw new BadRequestException('Mapping must be a valid JSON object');
    }
  })
  @IsObject()
  mapping?: Record<string, BulkInventoryField>;
}
