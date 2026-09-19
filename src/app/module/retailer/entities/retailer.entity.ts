import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type RetailerDocument = HydratedDocument<Retailer>;

const GeoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) =>
          value.length === 2 &&
          value.every(Number.isFinite) &&
          Math.abs(value[0]) <= 180 &&
          Math.abs(value[1]) <= 90,
        message:
          'Coordinates must be [longitude, latitude] within valid ranges',
      },
    },
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class Retailer {
  @Prop({ type: GeoPointSchema, default: undefined })
  location?: { type: 'Point'; coordinates: [number, number] };

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
  banner!: string;

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
RetailerSchema.index({ location: '2dsphere' });
