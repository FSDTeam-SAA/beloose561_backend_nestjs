import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactInfoDto {
  @ApiPropertyOptional({ example: 'saurav@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsNotEmpty()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, Anytown, USA' })
  @IsNotEmpty()
  @IsString()
  address?: string;
}
