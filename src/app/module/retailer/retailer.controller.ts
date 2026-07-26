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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';
import { RetailerService } from './retailer.service';

@ApiTags('retailer')
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

  @Get()
  @ApiOperation({ summary: 'Get all retailers' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'storeName', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'address', required: false })
  @ApiQuery({ name: 'phoneNumber', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'storeSlug', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllRetailers(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'storeName',
      'email',
      'address',
      'phoneNumber',
      'city',
      'description',
      'storeSlug',
      'status',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.retailerService.getAllRetailers(filters, options);
    return {
      message: 'All retailers retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my retailer profile' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getMyRetailer(@Req() req: Request) {
    const result = await this.retailerService.getMyRetailer(req.user!.id);
    return { message: 'Retailer retrieved successfully', data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get retailer by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getRetailerById(@Param('id') id: string) {
    const result = await this.retailerService.getRetailerById(id);
    return {
      message: 'Retailer retrieved successfully',
      data: result,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get retailer by slug' })
  @HttpCode(HttpStatus.OK)
  async getRetailerBySlug(@Param('slug') slug: string) {
    const result = await this.retailerService.getRetailerBySlug(slug);
    return {
      message: 'Retailer retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update retailer by id' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer', 'admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.OK)
  async updateRetailerById(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() updateRetailerDto: UpdateRetailerDto,
    @UploadedFiles()
    files?: { logo?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const result = await this.retailerService.updateRetailer(
      id,
      updateRetailerDto,
      files,
      req.user,
    );
    return {
      message: 'Retailer updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete retailer by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer', 'admin'))
  @HttpCode(HttpStatus.OK)
  async deleteRetailerById(@Param('id') id: string) {
    const result = await this.retailerService.deleteRetailer(id);
    return {
      message: 'Retailer deleted successfully',
      data: result,
    };
  }
}
