import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class ReceiveShipmentDto {
  @ApiProperty({ example: 12, description: 'Quantity received in shipment' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}
