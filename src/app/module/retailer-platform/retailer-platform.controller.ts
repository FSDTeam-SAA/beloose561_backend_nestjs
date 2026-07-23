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
import { CreateRetailerPlatformDto } from './dto/create-retailer-platform.dto';
import { UpdateRetailerPlatformDto } from './dto/update-retailer-platform.dto';
import { RetailerPlatformService } from './retailer-platform.service';

@ApiTags('retailer-platform')
@Controller('retailer-platform')
export class RetailerPlatformController {
  constructor(
    private readonly retailerPlatformService: RetailerPlatformService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create Retailer Platform' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createRetailerPlatform(
    @Body() createRetailerPlatformDto: CreateRetailerPlatformDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerPlatformService.createRetailerPlatform(
      createRetailerPlatformDto,
      file,
    );

    return {
      message: 'Retailer Platform created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get All Retailer Platform' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'platformLabel', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'highlightedTitle', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'imageLabel', required: false })
  @ApiQuery({ name: 'imageTitle', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllRetailerPlatform(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'platformLabel',
      'title',
      'highlightedTitle',
      'description',
      'imageLabel',
      'imageTitle',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.retailerPlatformService.getAllRetailerPlatform(
      filters,
      options,
    );
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Retailer Platform' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteRetailerPlatform(@Param('id') id: string) {
    const result =
      await this.retailerPlatformService.deleteRetailerPlatform(id);
    return {
      message: 'Retailer Platform deleted successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Single Retailer Platform' })
  @HttpCode(HttpStatus.OK)
  async getSingleRetailerPlatform(@Param('id') id: string) {
    const result =
      await this.retailerPlatformService.getSingleRetailerPlatform(id);
    return {
      message: 'Single Retailer Platform retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Retailer Platform' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async updateRetailerPlatform(
    @Param('id') id: string,
    @Body() updateRetailerPlatformDto: UpdateRetailerPlatformDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerPlatformService.updateRetailerPlatform(
      id,
      updateRetailerPlatformDto,
      file,
    );
    return {
      message: 'Retailer Platform updated successfully',
      data: result,
    };
  }
}
