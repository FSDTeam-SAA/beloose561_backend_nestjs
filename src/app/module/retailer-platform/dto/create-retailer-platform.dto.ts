import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

const JsonStringToArray = () =>
  Transform(({ value }) => {
    if (value === '' || value === undefined) return undefined;
    if (Array.isArray(value)) return value;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return JSON.parse(value);
    } catch {
      return value;
    }
  });

export class RetailerPlatformFeatureDto {
  @ApiPropertyOptional({ example: 'box' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'Inventory Management' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example:
      'Receive shipments, track stock levels, and manage your entire catalog with precision.',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  description?: string;
}

export class CreateRetailerPlatformDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'THE PLATFORM' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  platformLabel?: string;

  @ApiPropertyOptional({ example: 'Why Retailers Choose' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Humidor411' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  highlightedTitle?: string;

  @ApiPropertyOptional({
    example:
      'Purpose-built for premium cigar retailers, not adapted from generic inventory software.',
  })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'DESIGNED FOR THE DISCERNING RETAILER' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  imageLabel?: string;

  @ApiPropertyOptional({ example: 'Six tools. One seamless platform.' })
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  imageTitle?: string;

  @ApiPropertyOptional({
    type: [RetailerPlatformFeatureDto],
    example: [
      {
        icon: 'box',
        title: 'Inventory Management',
        description:
          'Receive shipments, track stock levels, and manage your entire catalog with precision.',
      },
    ],
  })
  @IsOptional()
  @JsonStringToArray()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetailerPlatformFeatureDto)
  features?: RetailerPlatformFeatureDto[];
}
