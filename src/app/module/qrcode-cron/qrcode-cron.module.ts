import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Qrcode, QrcodeSchema } from '../qrcodes/entities/qrcode.entity';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { QrcodeCronService } from './qrcode-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Retailer.name, schema: RetailerSchema },
      { name: Qrcode.name, schema: QrcodeSchema },
    ]),
  ],
  providers: [QrcodeCronService],
})
export class QrcodeCronModule {}
