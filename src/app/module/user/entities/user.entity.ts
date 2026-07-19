import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import config from '../../../config';
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: [true, 'Full name is required'],
    trim: true,
  })
  fullName!: string;

  // @Prop()
  // businessName?: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  })
  password!: string;

  @Prop({
    enum: ['retailer', 'admin', 'customer'],
    default: 'retailer',
  })
  role!: string;

  @Prop({ enum: ['male', 'female'] })
  gender!: string;

  @Prop({ enum: ['pending', 'verified'], default: 'pending' })
  verfied?: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  address!: string;

  @Prop()
  profilePicture!: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiry?: Date;

  @Prop({ enum: ['active', 'suspended'], default: 'active' })
  status!: string;

  @Prop()
  verifiedForget!: boolean;

  @Prop({ default: false })
  isSubscription!: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Subscribe' })
  subscription!: Types.ObjectId;

  @Prop({ type: Date })
  subscriptionExpiry!: Date | null;

  @Prop()
  stripeAccountId!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcryptSaltRounds),
  );
});
