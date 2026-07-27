import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { NotifationService } from './notifation.service';

@ApiTags('notifation')
@Controller('notifation')
export class NotifationController {
  constructor(private readonly notifationService: NotifationService) {}

  @Get()
  @ApiOperation({ summary: 'Get Admin Notifications' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'isRead', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getAdminNotifications(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const isRead =
      req.query.isRead === undefined ? undefined : req.query.isRead === 'true';

    const result = await this.notifationService.getAdminNotifications(
      options,
      isRead,
    );
    return {
      message: 'Notifications retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get My Notifications (Retailer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @ApiQuery({ name: 'isRead', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @HttpCode(HttpStatus.OK)
  async getMyNotifications(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const isRead =
      req.query.isRead === undefined ? undefined : req.query.isRead === 'true';

    const result = await this.notifationService.getMyNotifications(
      req.user!.id,
      options,
      isRead,
    );
    return {
      message: 'Notifications retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark All Admin Notifications As Read' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async markAllAdminAsRead() {
    const result = await this.notifationService.markAllAdminAsRead();
    return { message: 'Notifications marked as read', data: result };
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Mark All My Notifications As Read (Retailer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('retailer'))
  @HttpCode(HttpStatus.OK)
  async markAllMineAsRead(@Req() req: Request) {
    const result = await this.notifationService.markAllMineAsRead(req.user!.id);
    return { message: 'Notifications marked as read', data: result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark Notification As Read' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'retailer'))
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string) {
    const result = await this.notifationService.markAsRead(id);
    return { message: 'Notification marked as read', data: result };
  }
}
