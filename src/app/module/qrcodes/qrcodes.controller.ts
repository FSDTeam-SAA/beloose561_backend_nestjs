import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { QrcodesService } from './qrcodes.service';

@ApiTags('qrcodes')
@Controller('qrcodes')
export class QrcodesController {
  constructor(private readonly qrcodesService: QrcodesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all QR codes (admin)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getAllQrcodes() {
    const result = await this.qrcodesService.getAllQrcodes();

    return {
      message: 'QR codes retrieved successfully',
      data: result,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my store QR code (retailer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getMyQrcode(@Req() req: Request) {
    const result = await this.qrcodesService.getMyQrcode(req.user!.id);

    return {
      message: 'QR code retrieved successfully',
      data: result,
    };
  }

  @Post('regenerate')
  @ApiOperation({ summary: 'Regenerate my store QR code (retailer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async regenerateQrcode(@Req() req: Request) {
    const result = await this.qrcodesService.regenerateQrcode(req.user!.id);

    return {
      message: 'QR code regenerated successfully',
      data: result,
    };
  }
}
