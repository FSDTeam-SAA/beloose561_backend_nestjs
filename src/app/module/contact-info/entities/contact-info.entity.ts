import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactInfoDocument = HydratedDocument<ContactInfo>;

@Schema({ timestamps: true })
export class ContactInfo {
  @Prop()
  email!: string;

  @Prop()
  phone!: string;

  @Prop()
  address!: string;
}

export const ContactInfoSchema = SchemaFactory.createForClass(ContactInfo);
