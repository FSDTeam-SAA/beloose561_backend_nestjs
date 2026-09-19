import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJournalDto {
  @ApiProperty({
    description: 'Master Cigar ID',
    example: '68ca9b7e3b4f7e0012345678',
  })
  @IsNotEmpty()
  @IsMongoId()
  cigarId!: string;

  @ApiPropertyOptional({
    description: 'Retailer ID where the cigar was purchased or smoked',
    example: '68ca9c2e3b4f7e0012345679',
  })
  @IsOptional()
  @IsMongoId()
  retailerId?: string;

  @ApiPropertyOptional({
    description:
      'Date and time when the customer smoked the cigar. Defaults to current time if omitted.',
    example: '2026-09-17T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  smokedAt?: string;

  @ApiPropertyOptional({
    description: 'Customer rating for the cigar from 1 to 5',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Personal smoking notes',
    example:
      'Very smooth cigar. Cedar and coffee became stronger in the second half.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Flavors experienced while smoking',
    example: ['cedar', 'coffee', 'nuts'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  flavorTags?: string[];

  @ApiPropertyOptional({
    description: 'Customer impression of the cigar strength',
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  strengthImpression?: string;

  @ApiPropertyOptional({
    description: 'Price paid by the customer',
    example: 14.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePaid?: number;

  @ApiPropertyOptional({
    description: 'Whether the customer would smoke this cigar again',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  wouldSmokeAgain?: boolean;
}
