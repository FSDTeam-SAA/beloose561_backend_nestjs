import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResolveStoreDto {
  @ApiProperty({ example: 'https://humidor411.com/store/abc-cigars' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  value!: string;
}
