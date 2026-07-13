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
import { CreateMasterDatabaseDto } from './dto/create-master-database.dto';
import { UpdateMasterDatabaseDto } from './dto/update-master-database.dto';
import { MasterDatabaseService } from './master-database.service';

@ApiTags('master-database')
@Controller('master-database')
export class MasterDatabaseController {
  constructor(private readonly masterDatabaseService: MasterDatabaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create master database' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createMasterDatabase(
    @Body() createMasterDatabaseDto: CreateMasterDatabaseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.masterDatabaseService.createMasterDatabase(
      createMasterDatabaseDto,
      file,
    );

    return {
      message: 'Master database created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all master database' })
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'name', type: 'string', required: false })
  @ApiQuery({ name: 'brand', type: 'string', required: false })
  @ApiQuery({ name: 'productLine', type: 'string', required: false })
  @ApiQuery({ name: 'manufacturer', type: 'string', required: false })
  @ApiQuery({ name: 'country', type: 'string', required: false })
  @ApiQuery({ name: 'wrapper', type: 'string', required: false })
  @ApiQuery({ name: 'binder', type: 'string', required: false })
  @ApiQuery({ name: 'filler', type: 'string', required: false })
  @ApiQuery({ name: 'strength', type: 'string', required: false })
  @ApiQuery({ name: 'size', type: 'string', required: false })
  @ApiQuery({ name: 'length', type: 'string', required: false })
  @ApiQuery({ name: 'flavorNotes', type: 'string', required: false })
  @ApiQuery({ name: 'smokingTime', type: 'string', required: false })
  @ApiQuery({ name: 'description', type: 'string', required: false })
  @ApiQuery({ name: 'whyYoullLikeThis', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllMasterDatabase(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'brand',
      'productLine',
      'manufacturer',
      'country',
      'wrapper',
      'binder',
      'filler',
      'strength',
      'size',
      'length',
      'flavorNotes',
      'smokingTime',
      'description',
      'whyYoullLikeThis',
      'status',
    ]);
    const params = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.masterDatabaseService.getAllMasterDatabase(
      filters,
      params,
    );
    return {
      message: 'Master database retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('/master-database/:id')
  @ApiOperation({ summary: 'Get master database by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getMasterDatabase(@Param('id') id: string) {
    const result = await this.masterDatabaseService.getMasterDatabaseById(id);
    return {
      message: 'Master database retrieved successfully',
      data: result,
    };
  }

  @Put('/master-database/:id')
  @ApiOperation({ summary: 'Update master database by id' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateMasterDatabase(
    @Param('id') id: string,
    @Body() updateMasterDatabaseDto: UpdateMasterDatabaseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.masterDatabaseService.updateMasterDatabaseById(
      id,
      updateMasterDatabaseDto,
      file,
    );
    return {
      message: 'Master database updated successfully',
      data: result,
    };
  }

  @Delete('/master-database/:id')
  @ApiOperation({ summary: 'Delete master database by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteMasterDatabase(@Param('id') id: string) {
    const result =
      await this.masterDatabaseService.deleteMasterDatabaseById(id);
    return {
      message: 'Master database deleted successfully',
      data: result,
    };
  }
}
