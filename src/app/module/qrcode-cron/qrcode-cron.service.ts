import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  buildStoreQrTarget,
  generateAndUploadQrCode,
} from '../../helpers/qrcodeGenerator';
import { Qrcode, QrcodeDocument } from '../qrcodes/entities/qrcode.entity';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';

@Injectable()
export class QrcodeCronService {
  private readonly logger = new Logger(QrcodeCronService.name);
  constructor(
    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,

    @InjectModel(Qrcode.name)
    private readonly qrCodeModel: Model<QrcodeDocument>,
  ) {}

  @Cron('0 0 0 1 1 *') // Runs every day at midnight
  async regenerateStoreQrCodes() {
    this.logger.log('🔄 QR code regeneration cron job started...');

    const retailers = await this.retailerModel.find({
      qrCodeUrl: { $exists: true, $ne: '' },
      storeSlug: { $exists: true, $ne: '' },
    });

    this.logger.log(
      `Found ${retailers.length} retailers with QR codes to regenerate.`,
    );
    for (const retailer of retailers) {
      try {
        const storeUrl = buildStoreQrTarget(retailer.storeSlug);
        const { url: newQrCodeUrl } = await generateAndUploadQrCode(storeUrl);

        // 1. Retailer collection-এ qrCodeUrl আপডেট
        await this.retailerModel.findByIdAndUpdate(retailer._id, {
          qrCodeUrl: newQrCodeUrl,
        });

        // 2. Qrcode collection-এ qrcodeUrl আপডেট
        await this.qrCodeModel.findOneAndUpdate(
          { retailerId: retailer._id },
          { qrcodeUrl: newQrCodeUrl },
        );

        this.logger.log(`✅ ${retailer.storeName} — QR regenerated`);
      } catch (error: any) {
        this.logger.error(
          `❌ ${retailer.storeName} (${retailer._id.toString()}): ${error.message}`,
        );
      }
    }
    this.logger.log('✅ QR code regeneration cron job completed!');
  }
}
