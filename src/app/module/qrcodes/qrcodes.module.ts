import { Module } from '@nestjs/common';
import { QrcodesService } from './qrcodes.service';
import { QrcodesController } from './qrcodes.controller';

@Module({
  controllers: [QrcodesController],
  providers: [QrcodesService],
})
export class QrcodesModule {}
