import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
    required: true,
  })
  storeId!: mongoose.Types.ObjectId;

  // Master DB-তে থাকলে এটা থাকবে
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterDatabase',
  })
  masterCigarId!: mongoose.Types.ObjectId;

  // Master DB-তে না থাকলে
  // নিজে দেবে (Under Review)
  @Prop()
  customName!: string;

  @Prop()
  customBrand!: string;

  @Prop()
  customStrength!: string;

  @Prop()
  customWrapper!: string;

  @Prop()
  customSize!: string;

  @Prop()
  customImage!: string;

  @Prop()
  customDescription!: string;

  // Location
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Humidor',
    required: true,
  })
  humidorId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  shelfName!: string;
  // Humidor-এর ভেতরের Shelf name

  // Stock
  @Prop({ required: true, min: 0 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  price!: number;

  // Customer Experience
  @Prop({ default: false })
  isStaffPick!: boolean;

  @Prop()
  staffPickNote!: string;
  // "Best Connecticut we carry"

  @Prop()
  staffPickBy!: string;
  // "Mike"

  @Prop({ default: false })
  isNewArrival!: boolean;

  @Prop()
  arrivalDate!: Date;

  @Prop({ default: false })
  isDailyFeatured!: boolean;

  @Prop()
  featuredNote!: string;

  // Status
  @Prop({
    enum: ['active', 'under_review', 'out_of_stock', 'inactive'],
    default: 'active',
  })
  status!: string;

  // Low Stock Alert
  @Prop({ default: 5 })
  lowStockThreshold!: number;

  // Analytics
  @Prop({ default: 0 })
  totalSearches!: number;

  @Prop({ default: 0 })
  totalViews!: number;

  @Prop()
  lastSoldDate!: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
