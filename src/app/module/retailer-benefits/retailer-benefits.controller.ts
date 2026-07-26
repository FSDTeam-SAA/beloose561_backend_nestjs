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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { CreateRetailerBenefitDto } from './dto/create-retailer-benefit.dto';
import { UpdateRetailerBenefitDto } from './dto/update-retailer-benefit.dto';
import { RetailerBenefitsService } from './retailer-benefits.service';

@ApiTags('retailer-benefits')
@Controller('retailer-benefits')
export class RetailerBenefitsController {
  constructor(
    private readonly retailerBenefitsService: RetailerBenefitsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create Retailer Benefit' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FilesInterceptor('images', 10, fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createRetailerBenefitDto: CreateRetailerBenefitDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const result = await this.retailerBenefitsService.createRetailerBenefit(
      createRetailerBenefitDto,
      files,
    );

    return {
      message: 'Retailer Benefit created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get All Retailer Benefits' })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'title', required: false })
  @ApiQuery({ name: 'subTitle', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'title', 'subTitle']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await this.retailerBenefitsService.findAllRetailerBenefits(
      filters,
      options,
    );
    return {
      message: 'All Retailer Benefits retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Single Retailer Benefit' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const result =
      await this.retailerBenefitsService.findOneRetailerBenefit(id);
    return {
      message: 'Retailer Benefit retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Retailer Benefit' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FilesInterceptor('images', 10, fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateRetailerBenefitDto: UpdateRetailerBenefitDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const result = await this.retailerBenefitsService.updateRetailerBenefit(
      id,
      updateRetailerBenefitDto,
      files,
    );
    return {
      message: 'Retailer Benefit updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Retailer Benefit' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.retailerBenefitsService.removeRetailerBenefit(id);
    return {
      message: 'Retailer Benefit deleted successfully',
      data: result,
    };
  }
}
