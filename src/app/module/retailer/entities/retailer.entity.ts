import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RetailerDocument = HydratedDocument<Retailer>;

@Schema({ timestamps: true })
export class Retailer {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ unique: true })
  storeName!: string;

  @Prop()
  address!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  city!: string;

  @Prop()
  logo!: string;

  @Prop()
  description!: string;

  @Prop()
  storeSlug!: string;

  @Prop()
  qrCodeUrl!: string;

  @Prop({
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  })
  status!: string;

  @Prop()
  rejectionReason!: string;

  @Prop({
    enum: ['none', 'monthly', 'yearly'],
    default: 'none',
  })
  subscriptionPlan!: string;

  @Prop({
    enum: ['inactive', 'active', 'overdue', 'cancelled'],
    default: 'inactive',
  })
  subscriptionStatus!: string;
}

export const RetailerSchema = SchemaFactory.createForClass(Retailer);
