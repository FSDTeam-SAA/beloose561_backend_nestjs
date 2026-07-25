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
import { CreateRetailerAboutDto } from './dto/create-retailer-about.dto';
import { UpdateRetailerAboutDto } from './dto/update-retailer-about.dto';
import { RetailerAboutService } from './retailer-about.service';

@ApiTags('retailer-about')
@Controller('retailer-about')
export class RetailerAboutController {
  constructor(private readonly retailerAboutService: RetailerAboutService) {}

  @Post()
  @ApiOperation({ summary: 'Create Retailer About' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createRetailerAbout(
    @Body() createRetailerAboutDto: CreateRetailerAboutDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerAboutService.createRetailerAbout(
      createRetailerAboutDto,
      file,
    );

    return {
      message: 'Retailer About created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get All Retailer About' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'features', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllRetailerAbout(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'description',
      'features',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.retailerAboutService.getAllRetailerAbout(
      filters,
      options,
    );
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Retailer About' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteRetailerAbout(@Param('id') id: string) {
    const result = await this.retailerAboutService.deleteRetailerAbout(id);
    return {
      message: 'Retailer About deleted successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Single Retailer About' })
  @HttpCode(HttpStatus.OK)
  async getSingleRetailerAbout(@Param('id') id: string) {
    const result = await this.retailerAboutService.getSingleRetailerAbout(id);
    return {
      message: 'Single Retailer About retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Retailer About' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async updateRetailerAbout(
    @Param('id') id: string,
    @Body() updateRetailerAboutDto: UpdateRetailerAboutDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerAboutService.updateRetailerAbout(
      id,
      updateRetailerAboutDto,
      file,
    );
    return {
      message: 'Retailer About updated successfully',
      data: result,
    };
  }
}
