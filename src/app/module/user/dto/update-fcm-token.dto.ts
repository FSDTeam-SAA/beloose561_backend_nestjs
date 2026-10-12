import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiProperty({ description: 'Firebase Cloud Messaging device token' })
  @IsString()
  @IsNotEmpty()
  fcmToken!: string;
}
