import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RetailerHowitworkTitleDocument =
  HydratedDocument<RetailerHowitworkTitle>;

@Schema({ timestamps: true })
export class RetailerHowitworkTitle {
  @Prop()
  title!: string;
}

export const RetailerHowitworkTitleSchema = SchemaFactory.createForClass(
  RetailerHowitworkTitle,
);
