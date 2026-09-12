import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongoSchema } from 'mongoose';

@Schema({ timestamps: true })
export class ConsumerProfile {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({ enum: ['beginner', 'experienced'] })
  experienceLevel?: string;

  @Prop({ type: [String], default: [] })
  preferredStrengths!: string[];

  @Prop({ type: [String], default: [] })
  preferredWrappers!: string[];

  @Prop({ type: [String], default: [] })
  preferredFlavors!: string[];

  @Prop({ type: [String], default: [] })
  preferredOrigins!: string[];

  @Prop({ type: [String], default: [] })
  preferredSmokingTimes!: string[];

  @Prop({ type: [String], default: [] })
  favoriteBrands!: string[];

  @Prop({ min: 0 })
  minBudget?: number;

  @Prop({ min: 0 })
  maxBudget?: number;

  @Prop({ default: false })
  onboardingCompleted!: boolean;
}
export const ConsumerProfileSchema =
  SchemaFactory.createForClass(ConsumerProfile);
