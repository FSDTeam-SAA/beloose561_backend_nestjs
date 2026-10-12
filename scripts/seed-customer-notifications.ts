import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import {
  Notifation,
  NotifationSchema,
} from '../src/app/module/notifation/entities/notifation.entity';
import { User, UserSchema } from '../src/app/module/user/entities/user.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function getEmailArgument() {
  const emailFlagIndex = process.argv.indexOf('--email');
  return emailFlagIndex >= 0 ? process.argv[emailFlagIndex + 1] : undefined;
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  const email = getEmailArgument() || process.env.TEST_CUSTOMER_EMAIL;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required to seed customer notifications.');
  }
  if (!email) {
    throw new Error(
      'Pass --email <customer-email> or set TEST_CUSTOMER_EMAIL.',
    );
  }

  await mongoose.connect(mongoUri);

  const UserModel =
    mongoose.models.User || mongoose.model<User>('User', UserSchema);
  const NotifationModel =
    mongoose.models.Notifation ||
    mongoose.model<Notifation>('Notifation', NotifationSchema);

  const customer = await UserModel.findOne({
    email: email.toLowerCase(),
    role: 'customer',
  }).select('_id email');
  if (!customer) throw new Error(`Customer not found: ${email}`);

  const existingCount = await NotifationModel.countDocuments({
    recipientRole: 'customer',
    userId: customer._id,
  });

  if (existingCount > 0) {
    console.log(
      JSON.stringify({
        message: 'Customer already has notifications; no samples added',
        email: customer.email,
        count: existingCount,
      }),
    );
    return;
  }

  const created = await NotifationModel.create([
    {
      recipientRole: 'customer',
      userId: customer._id,
      type: 'customer_welcome',
      title: 'Welcome to Humidor 411',
      message: 'Your account is ready. Start discovering cigars near you.',
      isRead: true,
    },
    {
      recipientRole: 'customer',
      userId: customer._id,
      type: 'cigar_added',
      title: 'Cigar saved',
      message: 'Your cigar has been added to My Cigars.',
      isRead: false,
    },
    {
      recipientRole: 'customer',
      userId: customer._id,
      type: 'recommendation_ready',
      title: 'New recommendations',
      message: 'Fresh cigar recommendations are ready for you.',
      isRead: false,
    },
  ]);

  console.log(
    JSON.stringify({
      message: 'Seeded customer notifications',
      email: customer.email,
      count: created.length,
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
