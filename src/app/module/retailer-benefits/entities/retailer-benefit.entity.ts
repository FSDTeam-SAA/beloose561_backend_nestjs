import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RetailerBenefitDocument = HydratedDocument<RetailerBenefit>;

@Schema({ timestamps: true })
export class RetailerBenefit {
  @Prop()
  images!: string[];

  @Prop()
  title!: string;

  @Prop()
  subTitle!: string;

  @Prop()
  features!: string[];
}

export const RetailerBenefitSchema =
  SchemaFactory.createForClass(RetailerBenefit);
