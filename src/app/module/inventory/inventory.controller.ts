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
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get retailer inventory list' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'searchTerm', type: 'string', required: false })
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
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllInventory(@Req() req: Request) {
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
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.inventoryService.getAllInventory(
      req.user!.id,
      filters,
      options,
    );

    return {
      message: 'Inventory retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createInventory(
    @Req() req: Request,
    @Body() createInventoryDto: CreateInventoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.inventoryService.createInventory(
      req.user!.id,
      createInventoryDto,
      file,
    );

    return {
      message: 'Inventory created successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit inventory item' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateInventory(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.inventoryService.updateInventory(
      id,
      updateInventoryDto,
      file,
    );

    return {
      message: 'Inventory updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async deleteInventory(@Param('id') id: string) {
    const result = await this.inventoryService.deleteInventory(id);

    return {
      message: 'Inventory deleted successfully',
      data: result,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update inventory status admin' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async adminUpdateStatus(@Param('id') id: string, @Body() status: string) {
    const result = await this.inventoryService.adminUpdateStatus(id, status);

    return {
      message: 'Inventory status updated successfully',
      data: result,
    };
  }
}
