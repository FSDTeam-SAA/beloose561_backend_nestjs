import {
  Controller,
  Delete,
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Notification' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'retailer'))
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Param('id') id: string) {
    const result = await this.notifationService.deleteNotification(id);
    return { message: 'Notification deleted successfully', data: result };
  }
}

@ApiTags('notifications')
@Controller('notifications')
export class CustomerNotificationsController {
  constructor(private readonly notifationService: NotifationService) {}

  @Get()
  @ApiOperation({ summary: 'Get My Notifications (Customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('customer'))
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @HttpCode(HttpStatus.OK)
  async getMyNotifications(@Req() req: Request) {
    const options = pick(req.query, ['limit', 'page']);
    const result = await this.notifationService.getCustomerNotifications(
      req.user!.id,
      options,
    );
    return {
      message: 'Notifications retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get My Unread Notification Count (Customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('customer'))
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@Req() req: Request) {
    const count = await this.notifationService.getCustomerUnreadCount(
      req.user!.id,
    );
    return {
      message: 'Unread notification count retrieved successfully',
      data: { count },
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark All My Notifications As Read (Customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('customer'))
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: Request) {
    const result = await this.notifationService.markAllCustomerAsRead(
      req.user!.id,
    );
    return { message: 'Notifications marked as read', data: result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark My Notification As Read (Customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('customer'))
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req: Request, @Param('id') id: string) {
    const result = await this.notifationService.markCustomerAsRead(
      req.user!.id,
      id,
    );
    return { message: 'Notification marked as read', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete My Notification (Customer)' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('customer'))
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Req() req: Request, @Param('id') id: string) {
    const result = await this.notifationService.deleteCustomerNotification(
      req.user!.id,
      id,
    );
    return { message: 'Notification deleted successfully', data: result };
  }
}
