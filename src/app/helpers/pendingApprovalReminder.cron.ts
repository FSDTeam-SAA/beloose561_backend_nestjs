import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import cron from 'node-cron';
import {
  Inventory,
  InventoryDocument,
} from 'src/app/module/inventory/entities/inventory.entity';
import { NotifationService } from 'src/app/module/notifation/notifation.service';
import {
  Retailer,
  RetailerDocument,
} from 'src/app/module/retailer/entities/retailer.entity';
import { SettingsService } from 'src/app/module/settings/settings.service';

@Injectable()
export class PendingApprovalReminderCronService implements OnModuleInit {
  private readonly logger = new Logger(PendingApprovalReminderCronService.name);

  constructor(
    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly notifationService: NotifationService,
    private readonly settingsService: SettingsService,
  ) {}

  onModuleInit() {
    // Runs once a day at 9 AM server time.
    cron.schedule('0 0 9 * * *', () => void this.run());
  }

  private async run() {
    this.logger.log('Pending approval reminder cron is running...');

    const settings = await this.settingsService.getSettings();
    if (!settings.pendingApprovalReminders) return;

    const [pendingRetailers, pendingProducts] = await Promise.all([
      this.retailerModel.countDocuments({ status: 'pending' }),
      this.inventoryModel.countDocuments({ status: 'under_review' }),
    ]);

    if (pendingRetailers === 0 && pendingProducts === 0) return;

    await this.notifationService.notifyAdmin(
      'pending_approval_reminder',
      'Pending Approval Reminder',
      `${pendingProducts} product(s) and ${pendingRetailers} retailer(s) are awaiting your review`,
    );

    this.logger.log(
      `Pending approval reminder sent: ${pendingProducts} product(s), ${pendingRetailers} retailer(s)`,
    );
  }
}
