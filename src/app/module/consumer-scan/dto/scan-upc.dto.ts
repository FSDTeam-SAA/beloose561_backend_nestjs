import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StoreContextDto {
  @ApiPropertyOptional({ description: 'Approved retailer ID for Store Mode' })
  @IsOptional()
  @IsMongoId()
  retailerId?: string;
}

export class ScanUpcDto extends StoreContextDto {
  @ApiProperty({ example: '0716103012345' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  code!: string;
}
