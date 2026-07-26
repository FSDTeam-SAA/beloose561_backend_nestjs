import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

const StringToArray = () =>
  Transform(({ value }) => {
    if (value === '' || value === undefined) return undefined;
    if (Array.isArray(value)) return value;

    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON, fall through to comma-split
    }

    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  });

export class CreateRetailerBenefitDto {
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  subTitle?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Fast delivery', 'Best price'],
  })
  @IsOptional()
  @StringToArray()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
