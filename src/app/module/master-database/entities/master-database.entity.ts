import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MasterDatabaseDocument = HydratedDocument<MasterDatabase>;

@Schema({ timestamps: true })
export class MasterDatabase {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop({ enum: ['mild', 'medium', 'full', 'medium-full'] })
  strength!: string;

  @Prop()
  wrapper!: string;

  @Prop()
  size!: string;

  @Prop({ enum: ['30', '60', '90', '120+'] })
  smokingTime!: string;

  @Prop()
  image!: string;

  @Prop()
  description!: string;

  @Prop({ type: [String], default: [] })
  pairingSuggestions!: string[];

  @Prop({ default: 0, min: 0 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: false })
  isStaffPick!: boolean;

  @Prop()
  staffPickNote!: string;

  @Prop()
  staffPickBy!: string;

  @Prop()
  staffPickAddedAt!: Date;

  @Prop({ default: false })
  isNewArrival!: boolean;

  @Prop()
  arrivalDate!: Date;

  @Prop()
  newArrivalNote!: string;

  @Prop({ default: 30 })
  autoRemoveDays!: number;

  @Prop()
  newArrivalExpiresAt!: Date;

  @Prop({ default: false })
  isDailyFeatured!: boolean;

  @Prop()
  featuredNote!: string;

  @Prop()
  featuredDate!: Date;

  @Prop({ min: 0 })
  featuredPrice!: number;

  @Prop({
    enum: ['active', 'under_review', 'out_of_stock', 'inactive'],
    default: 'active',
  })
  status!: string;

  @Prop({ default: 5, min: 0 })
  lowStockThreshold!: number;

  @Prop({ default: 0 })
  totalSearches!: number;

  @Prop({ default: 0 })
  totalViews!: number;

  @Prop()
  lastSoldDate!: Date;

  @Prop({ default: 0 })
  totalSold!: number;

  @Prop({
    type: [
      {
        quantitySold: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        soldAt: { type: Date, required: true },
      },
    ],
    default: [],
  })
  salesHistory!: {
    quantitySold: number;
    unitPrice: number;
    totalAmount: number;
    soldAt: Date;
  }[];

  @Prop()
  lastLowStockNotificationAt!: Date;

  @Prop({ default: false })
  isOnDiscount!: boolean;

  @Prop({ min: 0, max: 100 })
  discountPercentage!: number;

  @Prop({ min: 0 })
  discountPrice!: number;

  @Prop()
  discountedAt!: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
  })
  submittedByRetailer!: mongoose.Types.ObjectId;
}

export const MasterDatabaseSchema =
  SchemaFactory.createForClass(MasterDatabase);
