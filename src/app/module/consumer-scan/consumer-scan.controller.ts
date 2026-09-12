import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsumerScanService } from './consumer-scan.service';
import { ScanUpcDto, StoreContextDto } from './dto/scan-upc.dto';
import type { Request } from 'express';
import { OptionalConsumerAuthGuard } from '../../middlewares/optional-consumer-auth.guard';
import { ConsumerActivityService } from '../consumer-activity/consumer-activity.service';

@ApiTags('consumer-scans')
@Controller('consumer/scans')
@UseGuards(OptionalConsumerAuthGuard)
export class ConsumerScanController {
  constructor(
    private readonly scanService: ConsumerScanService,
    private readonly activityService: ConsumerActivityService,
  ) {}

  @Post('upc')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Identify a cigar and optionally resolve store stock and locations',
  })
  async scan(@Body() dto: ScanUpcDto, @Req() req: Request) {
    const result = await this.scanService.scan(dto.code, dto.retailerId);
    if (req.user?.role === 'customer') {
      await this.activityService.record(req.user.id, 'scan_upc', {
        cigarId: String(result.cigar.id),
        retailerId: dto.retailerId,
      });
    }
    return {
      message: 'Cigar identified successfully',
      data: result,
    };
  }

  @Get('upc/:code')
  @ApiOperation({ summary: 'Look up a UPC with optional retailer context' })
  async lookup(
    @Param('code') code: string,
    @Query() query: StoreContextDto,
    @Req() req: Request,
  ) {
    return this.scan({ code, retailerId: query.retailerId }, req);
  }
}
