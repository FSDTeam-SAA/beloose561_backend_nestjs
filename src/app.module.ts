import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { AuthModule } from './app/module/auth/auth.module';
import { ContactModule } from './app/module/contact/contact.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { HumidorModule } from './app/module/humidor/humidor.module';
import { InventoryModule } from './app/module/inventory/inventory.module';
import { MasterDatabaseModule } from './app/module/master-database/master-database.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { QrcodesModule } from './app/module/qrcodes/qrcodes.module';
import { RetailerAboutModule } from './app/module/retailer-about/retailer-about.module';
import { RetailerBannerModule } from './app/module/retailer-banner/retailer-banner.module';
import { RetailerPlatformModule } from './app/module/retailer-platform/retailer-platform.module';
import { RetailerModule } from './app/module/retailer/retailer.module';
import { SubscribeModule } from './app/module/subscribe/subscribe.module';
import { UserModule } from './app/module/user/user.module';
import { WebhookModule } from './app/module/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
