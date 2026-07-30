import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type HumidorDocument = HydratedDocument<Humidor>;

class Shelf {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name!: string;
  // "Top Shelf", "Middle Shelf"

  @Prop()
  description!: string;

  @Prop({ default: 0 })
  cigarCount!: number;
}

class Wall {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;

  @Prop({ required: true, min: 1 })
  columns!: number;

  @Prop([
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      name: { type: String, required: true },
      description: String,
      cigarCount: { type: Number, default: 0 },
    },
  ])
  shelves!: Shelf[];
}

@Schema({ timestamps: true })
export class Humidor {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Retailer',
    required: true,
  })
  retailerId!: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name!: string;
  // "Main Humidor", "Walk-in Room"

  @Prop()
  location!: string;
  // "Front of Store", "Back Room"

  @Prop()
  description!: string;

  // A humidor is the room. Walls contain shelf rows and numbered columns.
  @Prop([
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      name: { type: String, required: true },
      description: String,
      columns: { type: Number, required: true, min: 1 },
      shelves: [
        {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId(),
          },
          name: { type: String, required: true },
          description: String,
          cigarCount: { type: Number, default: 0 },
        },
      ],
    },
  ])
  walls!: Wall[];

  // Legacy shape retained while existing records are migrated.
  @Prop([
    {
      _id: { type: mongoose.Schema.Types.ObjectId },
      name: String,
      description: String,
      rows: { type: Number, required: true, min: 1 },
      columns: { type: Number, required: true, min: 1 },
      cigarCount: { type: Number, default: 0 },
    },
  ])
  shelfes?: (Shelf & { rows: number; columns: number })[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const HumidorSchema = SchemaFactory.createForClass(Humidor);
