import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class CigarIdDto {
  @ApiProperty()
  @IsMongoId()
  cigarId!: string;
}

export class RateCigarDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class MyCigarsQueryDto {
  @ApiPropertyOptional({ enum: ['favorites', 'want-to-try', 'smoked'] })
  @IsOptional()
  @IsIn(['favorites', 'want-to-try', 'smoked'])
  type?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
