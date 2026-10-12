import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { Setting } from '../settings/entities/setting.entity';
import { SettingsService } from '../settings/settings.service';
import {
  Notifation,
  NotifationDocument,
  NotifationType,
} from './entities/notifation.entity';

type AdminSettingKey = keyof Pick<
  Setting,
  'newProductSubmissions' | 'newRetailerSignups' | 'pendingApprovalReminders'
>;

type RetailerSettingKey = keyof Pick<
  Setting,
  | 'retailerApprovalNotifications'
  | 'productApprovalNotifications'
  | 'subscriptionExpiryNotifications'
>;

@Injectable()
export class NotifationService {
  constructor(
    @InjectModel(Notifation.name)
    private readonly notifationModel: Model<NotifationDocument>,
    private readonly settingsService: SettingsService,
  ) {}

  // Admin-facing notifications are gated behind the matching Settings toggle.
  async notifyAdmin(
    type: NotifationType,
    title: string,
    message: string,
    relatedId?: Types.ObjectId | string,
    settingKey?: AdminSettingKey,
  ) {
    if (settingKey) {
      const settings = await this.settingsService.getSettings();
      if (!settings[settingKey]) return null;
    }

    return this.notifationModel.create({
      recipientRole: 'admin',
      type,
      title,
      message,
      relatedId,
    });
  }

  // Retailer-facing notifications (status updates about their own account/products),
  // also gated behind a Settings toggle so admins can turn each category off.
  async notifyRetailer(
    userId: Types.ObjectId | string,
    type: NotifationType,
    title: string,
    message: string,
    relatedId?: Types.ObjectId | string,
    settingKey?: RetailerSettingKey,
  ) {
    if (settingKey) {
      const settings = await this.settingsService.getSettings();
      if (!settings[settingKey]) return null;
    }

    return this.notifationModel.create({
      recipientRole: 'retailer',
      userId,
      type,
      title,
      message,
      relatedId,
    });
  }

  async getAdminNotifications(options: IOptions, isRead?: boolean) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions: Record<string, unknown> = { recipientRole: 'admin' };
    if (isRead !== undefined) whereConditions.isRead = isRead;

    const result = await this.notifationModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    const total = await this.notifationModel.countDocuments(whereConditions);
    const unreadCount = await this.notifationModel.countDocuments({
      recipientRole: 'admin',
      isRead: false,
    });

    return { meta: { page, limit, total, unreadCount }, data: result };
  }

  async getMyNotifications(
    userId: string,
    options: IOptions,
    isRead?: boolean,
  ) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions: Record<string, unknown> = {
      recipientRole: 'retailer',
      userId,
    };
    if (isRead !== undefined) whereConditions.isRead = isRead;

    const result = await this.notifationModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    const total = await this.notifationModel.countDocuments(whereConditions);
    const unreadCount = await this.notifationModel.countDocuments({
      recipientRole: 'retailer',
      userId,
      isRead: false,
    });

    return { meta: { page, limit, total, unreadCount }, data: result };
  }

  async getCustomerNotifications(userId: string, options: IOptions) {
    const { limit, page, skip } = paginationHelper({
      ...options,
      limit: options.limit ?? 20,
    });
    const whereConditions = { recipientRole: 'customer', userId };

    const [data, total] = await Promise.all([
      this.notifationModel
        .find(whereConditions)
        .sort({ createdAt: 'desc' })
        .skip(skip)
        .limit(limit),
      this.notifationModel.countDocuments(whereConditions),
    ]);

    return { meta: { page, limit, total }, data };
  }

  async getCustomerUnreadCount(userId: string) {
    return this.notifationModel.countDocuments({
      recipientRole: 'customer',
      userId,
      isRead: false,
    });
  }

  async markCustomerAsRead(userId: string, id: string) {
    const result = Types.ObjectId.isValid(id)
      ? await this.notifationModel.findOneAndUpdate(
          { _id: id, recipientRole: 'customer', userId },
          { isRead: true },
          { new: true },
        )
      : null;
    if (!result) throw new HttpException('Notification not found', 404);
    return result;
  }

  async markAllCustomerAsRead(userId: string) {
    const result = await this.notifationModel.updateMany(
      { recipientRole: 'customer', userId, isRead: false },
      { isRead: true },
    );
    return { updated: result.modifiedCount };
  }

  async deleteCustomerNotification(userId: string, id: string) {
    const result = Types.ObjectId.isValid(id)
      ? await this.notifationModel.findOneAndDelete({
          _id: id,
          recipientRole: 'customer',
          userId,
        })
      : null;
    if (!result) throw new HttpException('Notification not found', 404);
    return result;
  }

  async markAsRead(id: string) {
    const result = await this.notifationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    );
    if (!result) throw new HttpException('Notification not found', 404);
    return result;
  }

  async markAllAdminAsRead() {
    const result = await this.notifationModel.updateMany(
      { recipientRole: 'admin', isRead: false },
      { isRead: true },
    );
    return { updated: result.modifiedCount };
  }

  async markAllMineAsRead(userId: string) {
    const result = await this.notifationModel.updateMany(
      { recipientRole: 'retailer', userId, isRead: false },
      { isRead: true },
    );
    return { updated: result.modifiedCount };
  }

  async deleteNotification(id: string) {
    const result = await this.notifationModel.findByIdAndDelete(id);
    if (!result) throw new HttpException('Notification not found', 404);
    return result;
  }
}
