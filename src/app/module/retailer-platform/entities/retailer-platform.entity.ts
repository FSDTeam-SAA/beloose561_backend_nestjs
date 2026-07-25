import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RetailerPlatformDocument = HydratedDocument<RetailerPlatform>;

export class RetailerPlatformFeature {
  @Prop()
  icon!: string;

  @Prop()
  title!: string;

  @Prop()
  description!: string;
}

@Schema({ timestamps: true })
export class RetailerPlatform {
  @Prop()
  image!: string;

  @Prop()
  platformLabel!: string;

  @Prop()
  title!: string;

  @Prop()
  highlightedTitle!: string;

  @Prop()
  description!: string;

  @Prop()
  imageLabel!: string;

  @Prop()
  imageTitle!: string;

  @Prop({ type: [RetailerPlatformFeature] })
  features!: RetailerPlatformFeature[];
}

export const RetailerPlatformSchema =
  SchemaFactory.createForClass(RetailerPlatform);
