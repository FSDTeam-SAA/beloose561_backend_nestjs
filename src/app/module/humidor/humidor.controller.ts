import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
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
import { CreateHumidorDto } from './dto/create-humidor.dto';
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

  @Post('my-humidor')
  @ApiOperation({ summary: 'Get all my Humidor' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'description', required: false })
  @ApiQuery({ name: 'shelfes', required: false })
  @HttpCode(HttpStatus.CREATED)
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
}
