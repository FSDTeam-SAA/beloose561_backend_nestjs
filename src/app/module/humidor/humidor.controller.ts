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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from '../../helpers/pick';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateHumidorDto, HumidorShelfDto } from './dto/create-humidor.dto';
import { UpdateHumidorDto } from './dto/update-humidor.dto';
import { HumidorService } from './humidor.service';

@ApiTags('humidor')
@Controller('humidor')
export class HumidorController {
  constructor(private readonly humidorService: HumidorService) {}

  @Post()
  @ApiOperation({ summary: 'Create Humidor' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async createHumidor(
    @Req() req: Request,
    @Body() createHumidorDto: CreateHumidorDto,
  ) {
    const result = await this.humidorService.createHumidor(
      req.user!.id,
      createHumidorDto,
    );

    return {
      message: 'Humidor created successfully',
      data: result,
    };
  }

  @Get('my-humidor')
  @ApiOperation({ summary: 'Get all my Humidor' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'shelfes', required: false })
  @HttpCode(HttpStatus.OK)
  async getMyAllHumidor(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'location',
      'description',
      'shelfes',
    ]);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.humidorService.getMyAllHumidor(
      req.user!.id,
      filters,
      options,
    );

    return {
      message: 'Humidor retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post(':id/shelf')
  @ApiOperation({ summary: 'Add a shelf to my Humidor' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.CREATED)
  async addShelf(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() shelf: HumidorShelfDto,
  ) {
    const result = await this.humidorService.addShelf(id, req.user!.id, shelf);
    return { message: 'Shelf added successfully', data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Humidor by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async getHumidorById(@Param('id') id: string, @Req() req: Request) {
    const result = await this.humidorService.getHumidorById(id, req.user!.id);
    return { message: 'Humidor retrieved successfully', data: result };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Humidor by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async updateHumidorById(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() updateHumidorDto: UpdateHumidorDto,
  ) {
    const result = await this.humidorService.updateHumidor(
      id,
      req.user!.id,
      updateHumidorDto,
    );
    return { message: 'Humidor updated successfully', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Humidor by id' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async deleteHumidorById(@Param('id') id: string, @Req() req: Request) {
    const result = await this.humidorService.deleteHumidor(id, req.user!.id);
    return { message: 'Humidor deleted successfully', data: result };
  }
}
