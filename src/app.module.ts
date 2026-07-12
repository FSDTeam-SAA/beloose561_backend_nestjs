import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { ContactModule } from './app/module/contact/contact.module';
import { AuthModule } from './app/module/auth/auth.module';
import { UserModule } from './app/module/user/user.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { SubscribeModule } from './app/module/subscribe/subscribe.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { WebhookModule } from './app/module/webhook/webhook.module';
import { RetailerModule } from './app/module/retailer/retailer.module';
import { HumidorModule } from './app/module/humidor/humidor.module';
import { ShelfModule } from './app/module/shelf/shelf.module';
import { InventoryModule } from './app/module/inventory/inventory.module';
import { QrcodesModule } from './app/module/qrcodes/qrcodes.module';

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
    ShelfModule,
    InventoryModule,
    QrcodesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
