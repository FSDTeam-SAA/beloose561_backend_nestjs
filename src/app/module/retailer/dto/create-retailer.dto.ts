import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export enum RetailerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum SubscriptionPlan {
  NONE = 'none',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export class CreateRetailerDto {
  @ApiProperty({
    example: 'ABC Super Shop',
  })
  @IsString()
  @IsNotEmpty()
  storeName!: string;

  @ApiProperty({
    example: 'Mirpur 10, Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({
    example: '+8801712345678',
  })
  @IsPhoneNumber()
  phoneNumber!: string;

  @ApiProperty({
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({
    example: 'Best Grocery Store in Dhaka',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'abc-super-shop',
  })
  @IsOptional()
  @IsString()
  storeSlug?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/qrcode.png',
  })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @ApiPropertyOptional({
    enum: RetailerStatus,
    default: RetailerStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RetailerStatus)
  status?: RetailerStatus;

  @ApiPropertyOptional({
    example: 'Invalid documents',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    enum: SubscriptionPlan,
    default: SubscriptionPlan.NONE,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INACTIVE,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;
}
