import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class RecordSaleDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'How many cigars were sold. Defaults to 1 for one-click sale.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantitySold?: number;
}
