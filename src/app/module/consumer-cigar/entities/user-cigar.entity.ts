import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongoSchema } from 'mongoose';

@Schema({ timestamps: true })
export class UserCigar {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: 'MasterDatabase',
    required: true,
  })
  cigarId!: Types.ObjectId;

  @Prop({ default: false })
  isFavorite!: boolean;

  @Prop({ default: false })
  wantToTry!: boolean;

  @Prop({ default: false })
  hasSmoked!: boolean;

  @Prop({ min: 1, max: 5 })
  rating?: number;

  @Prop()
  lastSmokedAt?: Date;
}
export const UserCigarSchema = SchemaFactory.createForClass(UserCigar);
UserCigarSchema.index({ userId: 1, cigarId: 1 }, { unique: true });
