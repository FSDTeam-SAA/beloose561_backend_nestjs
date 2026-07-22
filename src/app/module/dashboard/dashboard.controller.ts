import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('retailer/today')
  @ApiOperation({
    summary:
      '"What should I do today?" retailer action dashboard - urgent alerts, needs-attention list, snapshot, and quick actions',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getRetailerActionCenter(@Req() req: Request) {
    const result = await this.dashboardService.getRetailerActionCenter(
      req.user!.id,
    );

    return {
      message: 'Retailer action dashboard retrieved successfully',
      data: result,
    };
  }

  @Get('retailer/cards')
  @ApiOperation({
    summary:
      'Retailer Cards - total revenue, units sold, average order value, slow stock, and retailer name',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getRetailerCards(@Req() req: Request, @Query('year') year?: string) {
    const result = await this.dashboardService.getRetailerCards(
      req.user!.id,
      year ? Number(year) : undefined,
    );

    return {
      message: 'Retailer cards retrieved successfully',
      data: result,
    };
  }

  @Get('retailer/sales-trend')
  @ApiOperation({
    summary: 'Retailer Sales Trend - monthly revenue line chart data',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getRetailerSalesTrend(
    @Req() req: Request,
    @Query('year') year?: string,
  ) {
    const result = await this.dashboardService.getRetailerSalesTrend(
      req.user!.id,
      year ? Number(year) : undefined,
    );

    return {
      message: 'Retailer sales trend retrieved successfully',
      data: result,
    };
  }

  @Get('retailer/business-insights')
  @ApiOperation({
    summary:
      'Retailer Business Insights - sales cards, trends, strength distribution, top products, and retailer name',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getRetailerBusinessInsights(
    @Req() req: Request,
    @Query('year') year?: string,
  ) {
    const result = await this.dashboardService.getRetailerBusinessInsights(
      req.user!.id,
      year ? Number(year) : undefined,
    );

    return {
      message: 'Retailer business insights retrieved successfully',
      data: result,
    };
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Get dashboard overview data',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async dashboardOverview() {
    const result = await this.dashboardService.dashboardOverView();

    return {
      message: 'Dashboard overview retrieved successfully',
      data: result,
    };
  }

  @Get('chart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Total earning chart — monthly revenue, commission & payout',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async getTotalEarningChart(@Query('year') year?: string) {
    const data = await this.dashboardService.getTotalEarningChart(
      year ? Number(year) : undefined,
    );
    return { message: 'Total earning chart fetched successfully', data };
  }
}
