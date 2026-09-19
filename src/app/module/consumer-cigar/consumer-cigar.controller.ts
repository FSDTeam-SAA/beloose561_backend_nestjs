import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { ConsumerCigarService } from './consumer-cigar.service';
import {
  CigarIdDto,
  MyCigarsQueryDto,
  RateCigarDto,
} from './dto/consumer-cigar.dto';

@ApiTags('consumer-cigars')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('customer'))
@Controller('consumer-cigars')
export class ConsumerCigarController {
  constructor(private readonly cigarService: ConsumerCigarService) {}

  @Get()
  async getMyCigars(@Req() req: Request, @Query() query: MyCigarsQueryDto) {
    const result = await this.cigarService.getMyCigars(req.user!.id, query);
    return { message: 'My cigars retrieved successfully', ...result };
  }

  @Post(':cigarId/favorite')
  async favorite(@Req() req: Request, @Param() params: CigarIdDto) {
    const result = await this.cigarService.setPreference(
      req.user!.id,
      params.cigarId,
      'isFavorite',
      true,
    );
    return { message: 'Cigar added to favorites', data: result };
  }

  @Delete(':cigarId/favorite')
  async unfavorite(@Req() req: Request, @Param() params: CigarIdDto) {
    const result = await this.cigarService.setPreference(
      req.user!.id,
      params.cigarId,
      'isFavorite',
      false,
    );
    return { message: 'Cigar removed from favorites', data: result };
  }

  @Post(':cigarId/want-to-try')
  async wantToTry(@Req() req: Request, @Param() params: CigarIdDto) {
    const result = await this.cigarService.setPreference(
      req.user!.id,
      params.cigarId,
      'wantToTry',
      true,
    );
    return { message: 'Cigar added to want-to-try', data: result };
  }

  @Delete(':cigarId/want-to-try')
  async removeWantToTry(@Req() req: Request, @Param() params: CigarIdDto) {
    const result = await this.cigarService.setPreference(
      req.user!.id,
      params.cigarId,
      'wantToTry',
      false,
    );
    return { message: 'Cigar removed from want-to-try', data: result };
  }

  @Post(':cigarId/smoked')
  async smoked(@Req() req: Request, @Param() params: CigarIdDto) {
    const result = await this.cigarService.setPreference(
      req.user!.id,
      params.cigarId,
      'hasSmoked',
      true,
    );
    return { message: 'Cigar marked as smoked', data: result };
  }

  @Post(':cigarId/rating')
  async rate(
    @Req() req: Request,
    @Param() params: CigarIdDto,
    @Body() dto: RateCigarDto,
  ) {
    const result = await this.cigarService.rateCigar(
      req.user!.id,
      params.cigarId,
      dto.rating,
    );
    return { message: 'Cigar rating saved', data: result };
  }
}
