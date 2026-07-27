import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ default: true })
  newProductSubmissions!: boolean;

  @Prop({ default: true })
  newRetailerSignups!: boolean;

  @Prop({ default: true })
  pendingApprovalReminders!: boolean;

  @Prop({ default: true })
  retailerApprovalNotifications!: boolean;

  @Prop({ default: true })
  productApprovalNotifications!: boolean;

  @Prop({ default: true })
  subscriptionExpiryNotifications!: boolean;

  @Prop({ default: true })
  allowRetailerSelfSignup!: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
