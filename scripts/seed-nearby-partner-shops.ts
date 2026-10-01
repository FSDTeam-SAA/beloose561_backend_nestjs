import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import {
  Retailer,
  RetailerSchema,
} from '../src/app/module/retailer/entities/retailer.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const TEST_LOCATION = {
  label: 'Times Square, New York, NY',
  latitude: 40.758,
  longitude: -73.9855,
};

const shops = [
  {
    storeName: '200 tobacco Smoke city',
    storeSlug: '200-tobacco-smoke-city',
    address: '200 W 40th St',
    city: 'New York',
    phoneNumber: '+1 212-000-0200',
    logo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    banner:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
    description:
      'Nearby partner tobacco shop seeded from Google Places around Times Square for map testing.',
    latitude: 40.7548003,
    longitude: -73.9882353,
  },
  {
    storeName: 'New York Smoke Shop',
    storeSlug: 'new-york-smoke-shop-9th-ave',
    address: '531 9th Ave',
    city: 'New York',
    phoneNumber: '+1 212-000-0531',
    logo: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',
    banner:
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1600&q=80',
    description:
      'Nearby partner smoke shop seeded from Google Places around Times Square for map testing.',
    latitude: 40.7569754,
    longitude: -73.994035,
  },
  {
    storeName: 'Zara Smoke Shop',
    storeSlug: 'zara-smoke-shop',
    address: '580 8th Ave',
    city: 'New York',
    phoneNumber: '+1 212-000-0580',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    banner:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80',
    description:
      'Nearby partner smoke shop seeded from Google Places around Times Square for map testing.',
    latitude: 40.7548774,
    longitude: -73.991259,
  },
  {
    storeName: 'International Smoke Shop',
    storeSlug: 'international-smoke-shop-8th-ave',
    address: '809 8th Ave',
    city: 'New York',
    phoneNumber: '+1 212-000-0809',
    logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    banner:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80',
    description:
      'Nearby partner smoke shop seeded from Google Places around Times Square for map testing.',
    latitude: 40.7615795,
    longitude: -73.9868625,
  },
];

async function main() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required to seed nearby partner shops.');
  }

  await mongoose.connect(mongoUri);

  const RetailerModel =
    mongoose.models.Retailer ||
    mongoose.model<Retailer>('Retailer', RetailerSchema);

  for (const shop of shops) {
    const { latitude, longitude, ...retailer } = shop;

    await RetailerModel.updateOne(
      { storeSlug: retailer.storeSlug },
      {
        $set: {
          ...retailer,
          status: 'approved',
          subscriptionPlan: 'monthly',
          subscriptionStatus: 'active',
          rejectionReason: '',
          qrCodeUrl: '',
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      },
      { upsert: true, runValidators: true },
    );
  }

  const seeded = await RetailerModel.find({
    storeSlug: { $in: shops.map((shop) => shop.storeSlug) },
  })
    .select('storeName storeSlug address city logo status location')
    .sort({ storeSlug: 1 })
    .lean();

  console.log(
    JSON.stringify(
      {
        message: 'Seeded nearby partner shops',
        centeredAround: TEST_LOCATION,
        count: seeded.length,
        shops: seeded.map((shop) => ({
          storeName: shop.storeName,
          storeSlug: shop.storeSlug,
          address: [shop.address, shop.city].filter(Boolean).join(', '),
          latitude: shop.location?.coordinates?.[1],
          longitude: shop.location?.coordinates?.[0],
          status: shop.status,
        })),
      },
      null,
      2,
    ),
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
