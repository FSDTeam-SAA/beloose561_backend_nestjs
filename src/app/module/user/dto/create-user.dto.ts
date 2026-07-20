import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const emptyStringToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class CreateUserDto {
  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsString()
  businessName!: string;

  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: ['retailer', 'customer', 'admin'] })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsEnum(['retailer', 'customer', 'admin'])
  role?: string;

  @ApiPropertyOptional({ enum: ['male', 'female'] })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  otpExpiry?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  verifiedForget?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'suspended'] })
  @Transform(emptyStringToUndefined)
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: '' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}
