import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MasterDatabaseDocument = HydratedDocument<MasterDatabase>;

@Schema({ timestamps: true })
export class MasterDatabase {
  @Prop({ required: true })
  name!: string;
  // "Padron 1964 Natural Toro"

  @Prop({ required: true })
  brand!: string;
  // "Padron"

  @Prop()
  productLine!: string;
  // "1964 Anniversary"

  @Prop()
  manufacturer!: string;
  // "Padron Cigars"

  @Prop()
  country!: string;
  // "Nicaragua"

  @Prop()
  wrapper!: string;
  // "Natural Colorado"

  @Prop()
  binder!: string;

  @Prop()
  filler!: string;

  @Prop({
    enum: ['mild', 'medium', 'full'],
  })
  strength!: string;

  @Prop()
  size!: string;
  // "Toro", "Robusto", "Churchill"

  @Prop()
  ringGauge!: number;
  // 52

  @Prop()
  length!: string;
  // "6.5 inches"

  @Prop([String])
  flavorNotes!: string[];
  // ["Chocolate", "Earth", "Coffee"]

  @Prop()
  smokingTime!: string;
  // "60-75 minutes"

  @Prop()
  image!: string;

  @Prop()
  description!: string;

  @Prop()
  whyYoullLikeThis!: string;
  // Plain language description

  @Prop()
  priceRange!: string;
  // "$20-30"

  @Prop({
    enum: ['pending', 'approved', 'denied'],
    default: 'approved',
  })
  status!: string;

  // Retailer Submit করলে
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
  })
  submittedByRetailer!: mongoose.Types.ObjectId;
}

export const MasterDatabaseSchema =
  SchemaFactory.createForClass(MasterDatabase);
