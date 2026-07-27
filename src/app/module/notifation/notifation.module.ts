import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PendingApprovalReminderCronService } from '../../helpers/pendingApprovalReminder.cron';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { SettingsModule } from '../settings/settings.module';
import { Notifation, NotifationSchema } from './entities/notifation.entity';
import { NotifationController } from './notifation.controller';
import { NotifationService } from './notifation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notifation.name, schema: NotifationSchema },
      { name: Retailer.name, schema: RetailerSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
    SettingsModule,
  ],
  controllers: [NotifationController],
  providers: [NotifationService, PendingApprovalReminderCronService],
  exports: [NotifationService],
})
export class NotifationModule {}
