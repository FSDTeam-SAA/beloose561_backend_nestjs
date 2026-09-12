import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { QrcodesService } from './qrcodes.service';
import { ResolveStoreDto } from './dto/resolve-store.dto';

@ApiTags('qrcodes')
@Controller('qrcodes')
export class QrcodesController {
  constructor(private readonly qrcodesService: QrcodesService) {}

  @Post('resolve-store')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve an existing store QR URL for Store Mode' })
  async resolveStore(@Body() dto: ResolveStoreDto) {
    const result = await this.qrcodesService.resolveStore(dto.value);
    return { message: 'Store identified successfully', data: result };
  }

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

  @Get('me/download')
  @ApiOperation({ summary: 'Download my store QR code (retailer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async downloadMyQrcode(@Req() req: Request, @Res() res: Response) {
    const file = await this.qrcodesService.downloadMyQrcode(req.user!.id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="beloose-store-qr.png"',
    );
    res.send(file.buffer);
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
