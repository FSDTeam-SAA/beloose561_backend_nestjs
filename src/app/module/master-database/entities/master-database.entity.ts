import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MasterDatabaseDocument = HydratedDocument<MasterDatabase>;

@Schema({ timestamps: true })
export class MasterDatabase {
  @Prop({ required: true })
  productLine!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop()
  strength!: string;

  @Prop()
  wrapper!: string;

  @Prop()
  estimatedSmokingTime!: string;

  @Prop()
  pairingSuggestions!: string[];

  @Prop()
  suggestedRetailPriceEach!: number;

  @Prop()
  suggestedRetailPricePerBox!: number;

  @Prop({
    enum: ['active', 'under_review', 'out_of_stock', 'inactive'],
    default: 'active',
  })
  status!: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
  })
  submittedByRetailer!: mongoose.Types.ObjectId;
}

export const MasterDatabaseSchema =
  SchemaFactory.createForClass(MasterDatabase);
