import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SocialMediaDocument = HydratedDocument<SocialMedia>;

@Schema({ _id: false })
export class SocialLink {
  @Prop({
    required: true,
    trim: true,
  })
  platform: string;

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ default: '' })
  icon: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);

@Schema({ timestamps: true })
export class SocialMedia {
  @Prop({
    required: true,
    trim: true,
    default:
      'The digital operating platform for premium cigar retailers. Digitizing the humidor experience, one shop at a time.',
  })
  description: string;

  @Prop({ type: [SocialLinkSchema], default: [] })
  socialLinks: SocialLink[];

  @Prop({ default: true })
  isActive: boolean;
}

export const SocialMediaSchema = SchemaFactory.createForClass(SocialMedia);
