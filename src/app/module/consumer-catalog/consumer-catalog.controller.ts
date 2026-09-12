import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalConsumerAuthGuard } from '../../middlewares/optional-consumer-auth.guard';
import { CigarIdDto } from '../consumer-cigar/dto/consumer-cigar.dto';
import { StoreContextDto } from '../consumer-scan/dto/scan-upc.dto';
import { ConsumerCatalogService } from './consumer-catalog.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';

@ApiTags('consumer-catalog')
@UseGuards(OptionalConsumerAuthGuard)
@Controller('consumer/cigars')
export class ConsumerCatalogController {
  constructor(private readonly catalogService: ConsumerCatalogService) {}

  @Get()
  async discover(@Query() query: CatalogQueryDto, @Req() req: Request) {
    const userId = req.user?.role === 'customer' ? req.user.id : undefined;
    const result = await this.catalogService.discover(query, userId);
    return { message: 'Cigars retrieved successfully', ...result };
  }

  @Get(':cigarId')
  async getDetail(
    @Param() params: CigarIdDto,
    @Query() query: StoreContextDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.role === 'customer' ? req.user.id : undefined;
    const result = await this.catalogService.getDetail(
      params.cigarId,
      query.retailerId,
      userId,
    );
    return { message: 'Cigar details retrieved successfully', data: result };
  }
}
