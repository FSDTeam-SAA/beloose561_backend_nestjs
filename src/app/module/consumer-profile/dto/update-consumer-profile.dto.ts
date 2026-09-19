import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  ValidateIf,
  IsString,
  Min,
  ArrayMaxSize,
  IsNotEmpty,
} from 'class-validator';

export class UpdateConsumerProfileDto {
  @ApiPropertyOptional({ enum: ['beginner', 'experienced'] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['beginner', 'experienced'])
  experienceLevel?: string;

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  preferredStrengths?: string[];

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  preferredWrappers?: string[];

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  preferredFlavors?: string[];

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  preferredOrigins?: string[];

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  preferredSmokingTimes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  favoriteBrands?: string[];

  @ApiPropertyOptional({ minimum: 0 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber()
  @Min(0)
  minBudget?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsNumber()
  @Min(0)
  maxBudget?: number;
}
