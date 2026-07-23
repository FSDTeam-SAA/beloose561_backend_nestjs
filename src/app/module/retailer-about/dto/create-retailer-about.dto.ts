import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRetailerAboutDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Fast delivery', 'Best price'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
