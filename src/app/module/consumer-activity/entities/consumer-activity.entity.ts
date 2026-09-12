import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongoSchema } from 'mongoose';

export const ACTIVITY_TYPES = [
  'view',
  'search',
  'scan_upc',
  'favorite',
  'unfavorite',
  'want_to_try',
  'remove_want_to_try',
  'smoked',
  'rating',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

@Schema({ timestamps: true })
export class ConsumerActivity {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'MasterDatabase' })
  cigarId?: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Retailer' })
  retailerId?: Types.ObjectId;

  @Prop({ type: String, enum: ACTIVITY_TYPES, required: true })
  type!: ActivityType;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop()
  searchTerm?: string;
}
export const ConsumerActivitySchema =
  SchemaFactory.createForClass(ConsumerActivity);
ConsumerActivitySchema.index({ userId: 1, createdAt: -1 });
