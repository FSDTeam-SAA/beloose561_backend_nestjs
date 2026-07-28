import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMasterDatabaseDto {
  @ApiProperty({
    example: 'Padron 1964 Anniversary Exclusivo',
    description: 'Master cigar name / product name',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Padron',
    description: 'Cigar brand name',
  })
  @IsString()
  brand!: string;

  @ApiPropertyOptional({
    example: 'Rich cocoa, espresso, cedar and pepper notes.',
    description: 'Product description or tasting profile',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Padron Cigars',
    description: 'Manufacturer name',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({
    example: 'Nicaragua',
    description: 'Country of origin',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 18,
    description:
      'Reference price only. Prefer MSRP / Suggested Retail Price instead of store selling price.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    enum: ['active', 'under_review', 'out_of_stock', 'inactive'],
    example: 'active',
    description: 'Master database record status',
  })
  @IsOptional()
  @IsEnum(['active', 'under_review', 'out_of_stock', 'inactive'])
  status?: string;
}
