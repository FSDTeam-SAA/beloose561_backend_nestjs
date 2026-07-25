import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RetailerBannerDocument = HydratedDocument<RetailerBanner>;

@Schema({ timestamps: true })
export class RetailerBanner {
  @Prop()
  banner!: string;

  @Prop()
  title!: string;

  @Prop()
  mainTitle!: string;

  @Prop()
  discription!: string;
}

export const RetailerBannerSchema =
  SchemaFactory.createForClass(RetailerBanner);
