import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Retailer, RetailerSchema } from '../retailer/entities/retailer.entity';
import { Qrcode, QrcodeSchema } from './entities/qrcode.entity';
import { QrcodesController } from './qrcodes.controller';
import { QrcodesService } from './qrcodes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Qrcode.name, schema: QrcodeSchema },
      { name: Retailer.name, schema: RetailerSchema },
    ]),
  ],
  controllers: [QrcodesController],
  providers: [QrcodesService],
})
export class QrcodesModule {}
