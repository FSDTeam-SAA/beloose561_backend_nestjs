import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type NotifationDocument = HydratedDocument<Notifation>;

export const NOTIFICATION_TYPES = [
  'new_product_submission',
  'new_retailer_signup',
  'pending_approval_reminder',
  'retailer_approved',
  'retailer_rejected',
  'product_approved',
  'subscription_expired',
] as const;

export type NotifationType = (typeof NOTIFICATION_TYPES)[number];

@Schema({ timestamps: true })
export class Notifation {
  @Prop({ enum: ['admin', 'retailer'], required: true })
  recipientRole!: string;

  // Only set when recipientRole === 'retailer' - the specific user to notify.
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ enum: NOTIFICATION_TYPES, required: true })
  type!: NotifationType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  relatedId?: Types.ObjectId;

  @Prop({ default: false })
  isRead!: boolean;
}

export const NotifationSchema = SchemaFactory.createForClass(Notifation);
