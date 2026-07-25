import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import pick from '../../helpers/pick';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateRetailerBannerDto } from './dto/create-retailer-banner.dto';
import { RetailerBannerService } from './retailer-banner.service';

@ApiTags('retailer-banner')
@Controller('retailer-banner')
export class RetailerBannerController {
  constructor(private readonly retailerBannerService: RetailerBannerService) {}

  @Post()
  @ApiOperation({ summary: 'Create Retailer Banner' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('banner', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createRetailerBanner(
    @Body() createRetailerBannerDto: CreateRetailerBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerBannerService.createRetailerBanner(
      createRetailerBannerDto,
      file,
    );

    return {
      message: 'Retailer Banner created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get All Retailer Banner' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'mainTitle', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllRetailerBanner(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'description',
      'mainTitle',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.retailerBannerService.getAllRetailerBanner(
      filters,
      options,
    );
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Retailer Banner' })
  @HttpCode(HttpStatus.OK)
  async deleteRetailerBanner(@Param('id') id: string) {
    const result = await this.retailerBannerService.deleteRetailerBanner(id);
    return {
      message: 'Retailer Banner deleted successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Single Retailer Banner' })
  @HttpCode(HttpStatus.OK)
  async getSingleRetailerBanner(@Param('id') id: string) {
    const result = await this.retailerBannerService.getSingleRetailerBanner(id);
    return {
      message: 'Single Retailer Banner retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Retailer Banner' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('banner', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async updateRetailerBanner(
    @Param('id') id: string,
    @Body() createRetailerBannerDto: CreateRetailerBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerBannerService.updateRetailerBanner(
      id,
      createRetailerBannerDto,
      file,
    );
    return result;
  }
}
