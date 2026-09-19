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
import { CreateJournalDto } from './dto/create-journal.dto';
import { JournalIdDto } from './dto/journal-id.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { JournalService } from './journal.service';

@ApiTags('journal')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('customer'))
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get my journal entry' })
  async getSingleJournal(@Req() req: Request, @Param() params: JournalIdDto) {
    const result = await this.journalService.getSingleJournal(
      req.user!.id,
      params.id,
    );
    return { message: 'Journal retrieved successfully', data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update my journal entry' })
  async updateJournal(
    @Req() req: Request,
    @Param() params: JournalIdDto,
    @Body() dto: UpdateJournalDto,
  ) {
    const result = await this.journalService.updateJournal(
      req.user!.id,
      params.id,
      dto,
    );
    return { message: 'Journal updated successfully', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete my journal entry' })
  async deleteJournal(@Req() req: Request, @Param() params: JournalIdDto) {
    const result = await this.journalService.deleteJournal(
      req.user!.id,
      params.id,
    );
    return { message: 'Journal deleted successfully', data: result };
  }

  @Post()
  @ApiOperation({ summary: 'Create a smoking journal entry' })
  @HttpCode(HttpStatus.CREATED)
  async createJournal(
    @Req() req: Request,
    @Body() createJournalDto: CreateJournalDto,
  ) {
    const result = await this.journalService.createJournal(
      req.user!.id,
      createJournalDto,
    );
    return { message: 'Journal created successfully', data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Get all journals' })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiQuery({ name: 'flavorTags', required: false })
  @ApiQuery({ name: 'strengthImpression', required: false })
  @ApiQuery({ name: 'smokedAt', required: false })
  @ApiQuery({ name: 'wouldSmokeAgain', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getJournals(@Req() req: Request) {
    const filter = pick(req.query, [
      'searchTerm',
      'rating',
      'flavorTags',
      'strengthImpression',
      'smokedAt',
      'wouldSmokeAgain',
    ]);
    const params = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.journalService.getJournals(
      req.user!.id,
      filter,
      params,
    );
    return {
      message: 'Journals retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }
}
