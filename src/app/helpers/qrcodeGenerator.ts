import * as QRCode from 'qrcode';
import config from '../config';
import { fileUpload } from './fileUploder';

export const buildStoreQrTarget = (storeSlug: string): string =>
  `${config.frontendUrl}/store/${storeSlug}`;

export const generateAndUploadQrCode = async (
  data: string,
): Promise<{ url: string; public_id: string }> => {
  const buffer = await QRCode.toBuffer(data, {
    type: 'png',
    width: 500,
    margin: 2,
  });

  return fileUpload.uploadBufferToCloudinary(
    buffer,
    `${config.cloudinary.folder}/qrcodes`,
  );
};
