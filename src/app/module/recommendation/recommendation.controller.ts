import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { RecommendationService } from './recommendation.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

@ApiTags('recommendations')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('customer'))
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Recommend cigars using my taste and activity, optionally in a selected store',
  })
  async getRecommendations(
    @Req() req: Request,
    @Query() query: RecommendationQueryDto,
  ) {
    const result = await this.recommendationService.getRecommendations(
      req.user!.id,
      query,
    );
    return { message: 'Recommendations retrieved successfully', ...result };
  }
}
