import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MasterDatabaseDocument = HydratedDocument<MasterDatabase>;

@Schema({ timestamps: true })
export class MasterDatabase {
  @Prop({ required: true, trim: true })
  productLine!: string;

  @Prop({ required: true, trim: true })
  brand!: string;

  @Prop({ type: [String], default: [], index: true })
  upcCodes!: string[];

  @Prop()
  name?: string;

  @Prop()
  manufacturer?: string;

  @Prop()
  country?: string;

  @Prop()
  strength?: string;

  @Prop()
  wrapper?: string;

  @Prop()
  binder?: string;

  @Prop({ type: [String], default: [] })
  filler?: string[];

  @Prop()
  size?: string;

  @Prop()
  length?: string;

  @Prop()
  ringGauge?: number;

  @Prop({ type: [String], default: [] })
  flavorNotes?: string[];

  @Prop()
  description?: string;

  @Prop()
  whyYoullLikeThis?: string;

  @Prop()
  image?: string;

  @Prop()
  estimatedSmokingTime?: string;

  @Prop({ type: [String], default: [] })
  pairingSuggestions!: string[];

  @Prop()
  suggestedRetailPriceEach?: number;

  @Prop()
  suggestedRetailPricePerBox?: number;

  @Prop({
    enum: ['active', 'under_review', 'out_of_stock', 'inactive'],
    default: 'active',
  })
  status!: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
  })
  submittedByRetailer?: mongoose.Types.ObjectId;
}

export const MasterDatabaseSchema =
  SchemaFactory.createForClass(MasterDatabase);

MasterDatabaseSchema.index({ brand: 1, productLine: 1 });
