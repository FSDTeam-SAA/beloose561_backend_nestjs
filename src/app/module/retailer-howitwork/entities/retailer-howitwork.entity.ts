import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RetailerHowitworkDocument = HydratedDocument<RetailerHowitwork>;

@Schema({ timestamps: true })
export class RetailerHowitwork {
  @Prop()
  image!: string;

  @Prop()
  title!: string;

  @Prop()
  description!: string;
}

export const RetailerHowitworkSchema =
  SchemaFactory.createForClass(RetailerHowitwork);
