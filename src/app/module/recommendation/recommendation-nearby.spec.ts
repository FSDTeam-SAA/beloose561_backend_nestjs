import { Types } from 'mongoose';
import { RecommendationService } from './recommendation.service';
import { NearbyRecommendationQueryDto } from './dto/nearby-recommendation-query.dto';

it('ranks nearby candidates with the existing preference scoring and attaches their store', async () => {
  const mildId = new Types.ObjectId();
  const fullId = new Types.ObjectId();
  const retailerId = new Types.ObjectId();
  const fullSelection = {
    store: {
      retailerId,
      storeName: 'Nearby Cigars',
      storeSlug: 'nearby-cigars',
      distance: 250,
      price: 11,
      pricePerBox: 220,
      quantity: 6,
    },
    location: {
      humidorId: new Types.ObjectId(),
      humidor: 'Main',
      wallId: null,
      wall: null,
      shelfId: null,
      shelf: 'Top',
      column: 1,
    },
  };
  const catalogService = {
    getNearbyCandidates: jest.fn().mockResolvedValue({
      cigars: [
        { _id: mildId, brand: 'A', productLine: 'Mild', strength: 'mild' },
        { _id: fullId, brand: 'B', productLine: 'Full', strength: 'full' },
      ],
      stores: new Map([
        [
          String(mildId),
          {
            ...fullSelection,
            store: { ...fullSelection.store, price: 9, quantity: 2 },
          },
        ],
        [String(fullId), fullSelection],
      ]),
    }),
  };
  const masterModel = {
    find: jest.fn(() => ({
      select: jest.fn(() => ({ lean: jest.fn().mockResolvedValue([]) })),
    })),
  };
  const journalModel = {
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    })),
  };
  const service = new RecommendationService(
    {
      getMyProfile: jest.fn().mockResolvedValue({
        onboardingCompleted: true,
        preferredStrengths: ['full'],
      }),
    } as never,
    { getAllUserStates: jest.fn().mockResolvedValue([]) } as never,
    { getRecentActivity: jest.fn().mockResolvedValue([]) } as never,
    catalogService as never,
    { getCigarDetails: (cigar: object) => cigar } as never,
    masterModel as never,
    journalModel as never,
  );
  const query = Object.assign(new NearbyRecommendationQueryDto(), {
    lat: 23.8,
    lng: 90.4,
    limit: 1,
  });

  const result = await service.getNearbyRecommendations('customer', query);

  expect(catalogService.getNearbyCandidates).toHaveBeenCalledWith(query);
  expect(result.meta).toEqual({ onboardingCompleted: true });
  expect(result.data).toHaveLength(1);
  expect(result.data[0]).toMatchObject({
    cigarId: String(fullId),
    matchScore: 25,
    available: true,
    price: 11,
    quantity: 6,
    store: fullSelection.store,
    location: fullSelection.location,
  });
});
