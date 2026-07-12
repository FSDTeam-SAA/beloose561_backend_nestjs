import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { RetailerService } from './retailer.service';

@Controller('retailer')
export class RetailerController {
  constructor(private readonly retailerService: RetailerService) {}

  @Post()
  @ApiOperation({ summary: 'Create retailer' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async createRetailer(
    @Req() req: Request,
    @Body() createRetailerDto: CreateRetailerDto,
  ) {
    const result = await this.retailerService.createRetailer(
      req.user!.id,
      createRetailerDto,
    );

    return {
      message: 'Retailer created successfully',
      data: result,
    };
  }
}
