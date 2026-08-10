import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { CreateRetailerHowitworkTitleDto } from './dto/create-retailer-howitwork-title.dto';
import { UpdateRetailerHowitworkTitleDto } from './dto/update-retailer-howitwork-title.dto';
import { RetailerHowitworkTitleService } from './retailer-howitwork-title.service';

@ApiTags('Retailer Howitwork Title')
@Controller('retailer-howitwork-title')
export class RetailerHowitworkTitleController {
  constructor(
    private readonly retailerHowitworkTitleService: RetailerHowitworkTitleService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create HowitworkTitle' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async createHowitworkTitle(
    @Body() createRetailerHowitworkTitleDto: CreateRetailerHowitworkTitleDto,
  ) {
    const result =
      await this.retailerHowitworkTitleService.createHowitworkTitle(
        createRetailerHowitworkTitleDto,
      );
    return {
      message: 'HowitworkTitle created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Find All HowitworkTitle' })
  @ApiQuery({ name: 'searchTerm', description: 'Search term', required: false })
  @ApiQuery({ name: 'title', description: 'Title', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Limit', required: false })
  @ApiQuery({ name: 'sortBy', description: 'Sort by', required: false })
  @ApiQuery({ name: 'sortOrder', description: 'Sort order', required: false })
  @HttpCode(HttpStatus.OK)
  async findAllHowitworkTitle(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'title']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result =
      await this.retailerHowitworkTitleService.findAllHowitworkTitle(
        filters,
        options,
      );
    return {
      message: 'HowitworkTitle found successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find Single HowitworkTitle' })
  @HttpCode(HttpStatus.OK)
  async getSingleHowitworkTitle(@Param('id') id: string) {
    const result =
      await this.retailerHowitworkTitleService.getSingleHowitworkTitle(id);
    return {
      message: 'HowitworkTitle found successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update HowitworkTitle' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async updateHowitworkTitle(
    @Param('id') id: string,
    @Body() updateRetailerHowitworkTitleDto: UpdateRetailerHowitworkTitleDto,
  ) {
    const result =
      await this.retailerHowitworkTitleService.updateHowitworkTitle(
        id,
        updateRetailerHowitworkTitleDto,
      );
    return {
      message: 'HowitworkTitle updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete HowitworkTitle' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async removeHowitworkTitle(@Param('id') id: string) {
    const result =
      await this.retailerHowitworkTitleService.removeHowitworkTitle(id);
    return {
      message: 'HowitworkTitle deleted successfully',
      data: result,
    };
  }
}
