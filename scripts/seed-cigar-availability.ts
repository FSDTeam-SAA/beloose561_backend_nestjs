import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import {
  MasterDatabase,
  MasterDatabaseSchema,
} from '../src/app/module/master-database/entities/master-database.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required to seed availability.');

  await mongoose.connect(mongoUri);
  const MasterModel =
    mongoose.models.MasterDatabase ||
    mongoose.model<MasterDatabase>('MasterDatabase', MasterDatabaseSchema);

  const cigars = await MasterModel.find({
    status: 'active',
    available: { $exists: false },
  })
    .sort({ _id: 1 })
    .select('_id')
    .lean();

  if (cigars.length) {
    await MasterModel.bulkWrite(
      cigars.map((cigar, index) => ({
        updateOne: {
          filter: { _id: cigar._id, available: { $exists: false } },
          // A deterministic mix keeps demo/test output stable between runs.
          update: { $set: { available: index % 4 !== 3 } },
        },
      })),
    );
  }

  const available = await MasterModel.countDocuments({
    status: 'active',
    available: true,
  });
  const unavailable = await MasterModel.countDocuments({
    status: 'active',
    available: false,
  });
  console.log(
    JSON.stringify({
      message: 'Seeded cigar availability',
      available,
      unavailable,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
