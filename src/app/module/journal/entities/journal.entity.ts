import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type JournalDocument = HydratedDocument<Journal>;

@Schema({ timestamps: true })
export class Journal {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'MasterDatabase' })
  cigarId!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
    default: null,
  })
  retailerId?: Types.ObjectId | null;

  @Prop({ required: true, default: Date.now })
  smokedAt!: Date;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop({ trim: true, maxlength: 2000 })
  notes?: string;

  @Prop({ type: [String], default: [] })
  flavorTags!: string[];

  @Prop()
  strengthImpression?: string;

  @Prop({ min: 0 })
  pricePaid?: number;

  @Prop()
  wouldSmokeAgain?: boolean;
}

export const JournalSchema = SchemaFactory.createForClass(Journal);
