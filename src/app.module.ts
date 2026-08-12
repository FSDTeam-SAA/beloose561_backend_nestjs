import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { AuthModule } from './app/module/auth/auth.module';
import { ContactInfoModule } from './app/module/contact-info/contact-info.module';
import { ContactModule } from './app/module/contact/contact.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { HumidorModule } from './app/module/humidor/humidor.module';
import { InventoryModule } from './app/module/inventory/inventory.module';
import { MasterDatabaseModule } from './app/module/master-database/master-database.module';
import { NotifationModule } from './app/module/notifation/notifation.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { QrcodeCronModule } from './app/module/qrcode-cron/qrcode-cron.module';
import { QrcodesModule } from './app/module/qrcodes/qrcodes.module';
import { RetailerAboutModule } from './app/module/retailer-about/retailer-about.module';
import { RetailerBannerModule } from './app/module/retailer-banner/retailer-banner.module';
import { RetailerBenefitsModule } from './app/module/retailer-benefits/retailer-benefits.module';
import { RetailerHowitworkTitleModule } from './app/module/retailer-howitwork-title/retailer-howitwork-title.module';
import { RetailerHowitworkModule } from './app/module/retailer-howitwork/retailer-howitwork.module';
import { RetailerPlatformModule } from './app/module/retailer-platform/retailer-platform.module';
import { RetailerModule } from './app/module/retailer/retailer.module';
import { SettingsModule } from './app/module/settings/settings.module';
import { SocialMediaModule } from './app/module/social-media/social-media.module';
import { SubscribeModule } from './app/module/subscribe/subscribe.module';
import { UserModule } from './app/module/user/user.module';
import { WebhookModule } from './app/module/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    ContactModule,
    DashboardModule,
    SubscribeModule,
    PaymentModule,
    WebhookModule,
    RetailerModule,
    HumidorModule,
    InventoryModule,
    QrcodesModule,
    MasterDatabaseModule,
    RetailerBannerModule,
    RetailerAboutModule,
    RetailerPlatformModule,
    RetailerHowitworkModule,
    RetailerBenefitsModule,
    NotifationModule,
    SettingsModule,
    ContactInfoModule,
    SocialMediaModule,
    RetailerHowitworkTitleModule,
    QrcodeCronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
