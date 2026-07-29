import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // not JSON, fall through to comma split
      }
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
