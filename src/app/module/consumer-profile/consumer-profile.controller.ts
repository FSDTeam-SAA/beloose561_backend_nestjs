import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { ConsumerProfileService } from './consumer-profile.service';
import { UpdateConsumerProfileDto } from './dto/update-consumer-profile.dto';

@ApiTags('consumer-profile')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('customer'))
@Controller('consumer-profile')
export class ConsumerProfileController {
  constructor(private readonly profileService: ConsumerProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my taste profile' })
  async getMyProfile(@Req() req: Request) {
    const result = await this.profileService.getMyProfile(req.user!.id);
    return { message: 'Taste profile retrieved successfully', data: result };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my taste preferences' })
  async updateMyProfile(
    @Req() req: Request,
    @Body() dto: UpdateConsumerProfileDto,
  ) {
    const result = await this.profileService.updateMyProfile(req.user!.id, dto);
    return { message: 'Taste profile updated successfully', data: result };
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Save preferences and complete onboarding' })
  async onboarding(@Req() req: Request, @Body() dto: UpdateConsumerProfileDto) {
    const result = await this.profileService.updateMyProfile(
      req.user!.id,
      dto,
      true,
    );
    return { message: 'Onboarding completed successfully', data: result };
  }
}
