import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import cron from 'node-cron';
import { NotifationService } from 'src/app/module/notifation/notifation.service';
import {
  Retailer,
  RetailerDocument,
} from 'src/app/module/retailer/entities/retailer.entity';
import {
  Subscribe,
  SubscribeDocument,
} from 'src/app/module/subscribe/entities/subscribe.entity';
import { User, UserDocument } from 'src/app/module/user/entities/user.entity';

@Injectable()
export class SubscribePaymentCronService implements OnModuleInit {
  private readonly logger = new Logger(SubscribePaymentCronService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Subscribe.name)
    private readonly subscribeModel: Model<SubscribeDocument>,
    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,
    private readonly notifationService: NotifationService,
  ) {}

  onModuleInit() {
    cron.schedule('0 0 */1 * * *', () => void this.run());
  }

  private async run() {
    this.logger.log('Cron is running...');
    const now = new Date();

    const expiredUsers = await this.userModel.find({
      isSubscription: true,
      subscriptionExpiry: { $lte: now },
    });

    for (const user of expiredUsers) {
      await this.subscribeModel.updateMany(
        { user: user._id },
        { $pull: { user: user._id } },
      );

      user.isSubscription = false;
      user.subscriptionExpiry = null;
      await user.save();

      await this.retailerModel.updateOne(
        { userId: user._id },
        { subscriptionPlan: 'none', subscriptionStatus: 'inactive' },
      );

      await this.notifationService.notifyRetailer(
        user._id,
        'subscription_expired',
        'Subscription Expired',
        'Your subscription has expired. Renew to keep your store active.',
        undefined,
        'subscriptionExpiryNotifications',
      );
    }

    this.logger.log(
      `Subscribe payment cron: ${expiredUsers.length} user(s) expired and updated`,
    );
  }
}
