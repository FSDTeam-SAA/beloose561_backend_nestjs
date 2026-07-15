import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type QrcodeDocument = HydratedDocument<Qrcode>;

@Schema({ timestamps: true })
export class Qrcode {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Retailer' })
  retailerId!: Types.ObjectId;

  @Prop()
  qrcodeUrl!: string;
}

export const QrcodeSchema = SchemaFactory.createForClass(Qrcode);
