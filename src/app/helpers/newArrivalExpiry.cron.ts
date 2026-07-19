import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import cron from 'node-cron';
import {
  Inventory,
  InventoryDocument,
} from 'src/app/module/inventory/entities/inventory.entity';

@Injectable()
export class NewArrivalExpiryCronService implements OnModuleInit {
  private readonly logger = new Logger(NewArrivalExpiryCronService.name);

  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  onModuleInit() {
    cron.schedule('0 0 0 * * *', () => void this.run());
  }

  private async run() {
    this.logger.log('New Arrival expiry cron is running...');
    const now = new Date();

    const expiredItems = await this.inventoryModel.find({
      isNewArrival: true,
      newArrivalExpiresAt: { $lte: now },
    });

    for (const item of expiredItems) {
      const listedDays = item.autoRemoveDays ?? 30;
      await this.inventoryModel.findByIdAndUpdate(item._id, {
        isNewArrival: false,
        $unset: { newArrivalNote: '', newArrivalExpiresAt: '' },
      });

      // TODO: wire up to a retailer notification channel once one exists.
      this.logger.log(
        `${item.name} is no longer showing as New Arrival. It was listed for ${listedDays} days. (retailerId: ${item.retailerId.toString()})`,
      );
    }

    this.logger.log(
      `New Arrival expiry cron: ${expiredItems.length} item(s) expired and updated`,
    );
  }
}
