import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MasterDatabaseDocument = HydratedDocument<MasterDatabase>;

@Schema({ timestamps: true })
export class MasterDatabase {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop()
  description!: string;

  @Prop()
  manufacturer!: string;

  @Prop()
  country!: string;

  @Prop()
  price!: number;

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
