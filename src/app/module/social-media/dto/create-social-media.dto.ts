import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class CreateSocialLinkDto {
  @ApiProperty({
    example: 'facebook',
    enum: ['facebook', 'instagram', 'linkedin', 'twitter', 'x'],
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    example: 'https://www.facebook.com/your-page',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    example: 'https://cdn.simpleicons.org/facebook',
    description:
      'Optional. You can ignore this field. Backend auto-generates icon url from platform',
  })
  @IsOptional()
  @IsUrl()
  icon?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSocialMediaDto {
  @ApiProperty({
    example:
      'The digital operating platform for premium cigar retailers. Digitizing the humidor experience, one shop at a time.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    type: [CreateSocialLinkDto],
    example: [
      {
        platform: 'facebook',
        url: 'https://www.facebook.com/your-page',
        isActive: true,
      },
      {
        platform: 'instagram',
        url: 'https://www.instagram.com/your-profile',
        isActive: true,
      },
      {
        platform: 'linkedin',
        url: 'https://www.linkedin.com/company/your-company',
        isActive: true,
      },
      {
        platform: 'twitter',
        url: 'https://twitter.com/your-profile',
        isActive: true,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSocialLinkDto)
  socialLinks?: CreateSocialLinkDto[];

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
