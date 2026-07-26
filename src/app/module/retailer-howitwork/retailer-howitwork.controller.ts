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
import { CreateRetailerHowitworkDto } from './dto/create-retailer-howitwork.dto';
import { UpdateRetailerHowitworkDto } from './dto/update-retailer-howitwork.dto';
import { RetailerHowitworkService } from './retailer-howitwork.service';

@ApiTags('retailer-howitwork')
@Controller('retailer-howitwork')
export class RetailerHowitworkController {
  constructor(
    private readonly retailerHowitworkService: RetailerHowitworkService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create retailer-howitwork' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createRetailerHowitworkDto: CreateRetailerHowitworkDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerHowitworkService.createRetailerHowitwork(
      createRetailerHowitworkDto,
      file,
    );

    return {
      message: 'RetailerHowitwork created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get All RetailerHowitwork' })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'title', 'description']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result =
      await this.retailerHowitworkService.findAllRetailerHowitworks(
        filters,
        options,
      );
    return {
      message: 'All RetailerHowitworks retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Single RetailerHowitwork' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const result =
      await this.retailerHowitworkService.findOneRetailerHowitwork(id);
    return {
      message: 'RetailerHowitwork retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update RetailerHowitwork' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateRetailerHowitworkDto: UpdateRetailerHowitworkDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.retailerHowitworkService.updateRetailerHowitwork(
      id,
      updateRetailerHowitworkDto,
      file,
    );
    return {
      message: 'RetailerHowitwork updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete RetailerHowitwork' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result =
      await this.retailerHowitworkService.removeRetailerHowitwork(id);
    return {
      message: 'RetailerHowitwork deleted successfully',
      data: result,
    };
  }
}
