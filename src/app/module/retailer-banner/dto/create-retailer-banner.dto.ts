import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRetailerBannerDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  mainTitle?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  discription?: string;
}
