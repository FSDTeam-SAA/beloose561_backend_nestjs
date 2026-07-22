import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import {
  buildStoreQrTarget,
  generateAndUploadQrCode,
} from '../../helpers/qrcodeGenerator';
import {
  Retailer,
  RetailerDocument,
} from '../retailer/entities/retailer.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { Qrcode, QrcodeDocument } from './entities/qrcode.entity';

@Injectable()
export class QrcodesService {
  constructor(
    @InjectModel(Qrcode.name)
    private readonly qrCodeModel: Model<QrcodeDocument>,

    @InjectModel(Retailer.name)
    private readonly retailerModel: Model<RetailerDocument>,

    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getAllQrcodes() {
    return this.qrCodeModel
      .find()
      .populate('userId', 'fullName email')
      .populate('retailerId', 'storeName storeSlug')
      .sort({ createdAt: -1 });
  }

  async getMyQrcode(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user is not found', 404);
    const qrcode = await this.qrCodeModel
      .findOne({ userId })
      .populate('retailerId', 'storeName storeSlug');
    if (!qrcode) throw new HttpException('QR code not found', 404);

    if (!user.isQrCode) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { isQrCode: true },
        { new: true },
      );
    }

    return qrcode;
  }

  async downloadMyQrcode(userId: string) {
    const qrcode = await this.qrCodeModel.findOne({ userId });
    if (!qrcode?.qrcodeUrl) throw new HttpException('QR code not found', 404);

    try {
      const response = await axios.get<ArrayBuffer>(qrcode.qrcodeUrl, {
        responseType: 'arraybuffer',
      });
      return {
        buffer: Buffer.from(response.data),
        contentType: String(response.headers['content-type'] || 'image/png'),
      };
    } catch {
      throw new HttpException('Could not download QR code', 502);
    }
  }

  async regenerateQrcode(userId: string) {
    const retailer = await this.retailerModel.findOne({ userId });
    if (!retailer) throw new HttpException('Retailer not found', 404);

    const storeUrl = buildStoreQrTarget(retailer.storeSlug);
    const { url: qrCodeUrl } = await generateAndUploadQrCode(storeUrl);

    retailer.qrCodeUrl = qrCodeUrl;
    await retailer.save();

    const qrcode = await this.qrCodeModel.findOneAndUpdate(
      { userId: retailer.userId, retailerId: retailer._id },
      { qrcodeUrl: qrCodeUrl },
      { new: true, upsert: true },
    );

    return qrcode;
  }
}
