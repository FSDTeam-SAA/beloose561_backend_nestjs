import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RetailerAboutDocument = HydratedDocument<RetailerAbout>;

@Schema({ timestamps: true })
export class RetailerAbout {
  @Prop()
  image!: string;

  @Prop()
  title!: string;

  @Prop()
  description!: string;

  @Prop()
  features!: string[];
}
export const RetailerAboutSchema = SchemaFactory.createForClass(RetailerAbout);
