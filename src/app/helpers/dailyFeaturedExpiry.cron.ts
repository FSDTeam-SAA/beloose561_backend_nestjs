import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import cron from 'node-cron';
import {
  Inventory,
  InventoryDocument,
} from 'src/app/module/inventory/entities/inventory.entity';

@Injectable()
export class DailyFeaturedExpiryCronService implements OnModuleInit {
  private readonly logger = new Logger(DailyFeaturedExpiryCronService.name);

  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  onModuleInit() {
    cron.schedule('0 0 0 * * *', () => void this.run());
  }

  private async run() {
    this.logger.log('Daily Featured expiry cron is running...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Items still flagged featured for a day before today (yesterday's
    // "Today's Featured") get cleared. Items planned for what is now
    // today are left alone - their featuredDate already matches today.
    const result = await this.inventoryModel.updateMany(
      { isDailyFeatured: true, featuredDate: { $lt: today } },
      {
        isDailyFeatured: false,
        $unset: { featuredNote: '', featuredDate: '', featuredPrice: '' },
      },
    );

    this.logger.log(
      `Daily Featured expiry cron: ${result.modifiedCount} item(s) cleared`,
    );
  }
}
