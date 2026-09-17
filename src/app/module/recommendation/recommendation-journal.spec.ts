import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RecommendationService } from './recommendation.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { ConsumerProfileService } from '../consumer-profile/consumer-profile.service';
import { ConsumerCigarService } from '../consumer-cigar/consumer-cigar.service';
import { ConsumerActivityService } from '../consumer-activity/consumer-activity.service';
import { ConsumerCatalogService } from '../consumer-catalog/consumer-catalog.service';
import { ConsumerScanService } from '../consumer-scan/consumer-scan.service';
import { Journal } from '../journal/entities/journal.entity';

it('reads owned live journals and changes recommendation results after create, edit and delete', async () => {
  const userId = new Types.ObjectId().toString();
  const cigarId = new Types.ObjectId();
  let journals: Partial<Journal>[] = [];
  const journalQuery = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn(() => Promise.resolve(journals)),
  };
  const journalModel = { find: jest.fn(() => journalQuery) };
  const cigar = {
    _id: cigarId,
    brand: 'Example',
    productLine: 'Classic',
    strength: 'medium',
    flavorNotes: ['cedar', 'coffee'],
  };
  const module = await Test.createTestingModule({
    providers: [
      RecommendationService,
      {
        provide: ConsumerProfileService,
        useValue: {
          getMyProfile: jest
            .fn()
            .mockResolvedValue({ preferredStrengths: ['medium'] }),
        },
      },
      {
        provide: ConsumerCigarService,
        useValue: { getAllUserStates: jest.fn().mockResolvedValue([]) },
      },
      {
        provide: ConsumerActivityService,
        useValue: { getRecentActivity: jest.fn().mockResolvedValue([]) },
      },
      {
        provide: ConsumerCatalogService,
        useValue: {
          getCandidates: jest
            .fn()
            .mockResolvedValue({ cigars: [cigar], inventory: [] }),
        },
      },
      {
        provide: ConsumerScanService,
        useValue: { getCigarDetails: (value: unknown) => value },
      },
      {
        provide: getModelToken('MasterDatabase'),
        useValue: {
          find: () => ({ select: () => ({ lean: () => Promise.resolve([]) }) }),
        },
      },
      { provide: getModelToken('Journal'), useValue: journalModel },
    ],
  }).compile();
  try {
    const service = module.get(RecommendationService);
    const query = new RecommendationQueryDto();
    const before = await service.getRecommendations(userId, query);
    expect(before.data[0].matchScore).toBe(25);
    journals = [
      {
        cigarId,
        flavorTags: ['cedar', 'coffee'],
        strengthImpression: 'medium',
        wouldSmokeAgain: true,
      },
    ];
    const created = await service.getRecommendations(userId, query);
    expect(created.data[0].matchScore).toBe(45);
    journals[0].wouldSmokeAgain = false;
    const edited = await service.getRecommendations(userId, query);
    expect(edited.data[0].matchScore).toBe(10);
    journals = [];
    const deleted = await service.getRecommendations(userId, query);
    expect(deleted.data[0].matchScore).toBe(25);
    expect(journalModel.find).toHaveBeenCalledWith({ userId });
    expect(journalQuery.sort).toHaveBeenCalledWith({ smokedAt: -1, _id: -1 });
    expect(journalQuery.limit).toHaveBeenCalledWith(100);
  } finally {
    await module.close();
  }
});
