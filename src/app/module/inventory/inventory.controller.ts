import {
  Body,
  Controller,
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
import { ReceiveShipmentDto } from './dto/receive-shipment.dto';
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
  @ApiQuery({ name: 'humidorId', type: 'string', required: false })
  @ApiQuery({ name: 'status', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllInventory(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'humidorId', 'status']);
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
  @UseInterceptors(FileInterceptor('customImage', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createInventory(
    @Req() req: Request,
    @Body() createInventoryDto: CreateInventoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.inventoryService.createInventory(
      req.user!.id,
      createInventoryDto,
      file,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit inventory item' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async updateInventory(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventory(
      req.user!.id,
      id,
      updateInventoryDto,
    );
  }

  @Post(':id/receive-shipment')
  @ApiOperation({ summary: 'Receive shipment and increase inventory quantity' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async receiveShipment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() receiveShipmentDto: ReceiveShipmentDto,
  ) {
    return this.inventoryService.receiveShipment(
      req.user!.id,
      id,
      receiveShipmentDto,
    );
  }
}
