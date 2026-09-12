import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Response } from 'express';
import { scoreCigar, BehaviorPreferences } from './recommendation-score';
import { RecommendationService } from './recommendation.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { MasterDatabase } from '../master-database/entities/master-database.entity';
import { CreateMasterDatabaseDto } from '../master-database/dto/create-master-database.dto';
import { MasterDatabaseService } from '../master-database/master-database.service';
import { ConsumerProfileService } from '../consumer-profile/consumer-profile.service';
import { UpdateConsumerProfileDto } from '../consumer-profile/dto/update-consumer-profile.dto';
import { CustomerRegisterDto } from '../auth/dto/customer-register.dto';
import { AuthService } from '../auth/auth.service';
import { ConsumerCigarService } from '../consumer-cigar/consumer-cigar.service';
import { ConsumerScanService } from '../consumer-scan/consumer-scan.service';
import { ConsumerCatalogService } from '../consumer-catalog/consumer-catalog.service';
import { CatalogQueryDto } from '../consumer-catalog/dto/catalog-query.dto';
import { ScanUpcDto } from '../consumer-scan/dto/scan-upc.dto';
import { QrcodesService } from '../qrcodes/qrcodes.service';
import config from '../../config';

function queryResult(value: unknown) {
  const query = {
    select: jest.fn(),
    sort: jest.fn(),
    populate: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue(value),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(value).then(resolve),
  };
  for (const method of [
    query.select,
    query.sort,
    query.populate,
    query.skip,
    query.limit,
  ])
    method.mockReturnValue(query);
  return query;
}

const cigarId = new Types.ObjectId();
const retailerId = new Types.ObjectId().toString();
const userId = new Types.ObjectId().toString();
const cigar = {
  _id: cigarId,
  brand: 'Padron',
  productLine: 'Toro',
  upcCodes: ['001234567890'],
  strength: 'Medium',
  wrapper: 'Natural',
  flavorNotes: ['Cocoa', 'Coffee'],
  country: 'Nicaragua',
  suggestedRetailPriceEach: 10,
} as MasterDatabase & { _id: Types.ObjectId };
const emptyBehavior: BehaviorPreferences = {
  brands: [],
  strengths: [],
  searchTerms: [],
  dislikedCigarIds: [],
};

describe('Consumer demo flows', () => {
  it('matches app smoking minutes with existing master hour values', () => {
    expect(
      scoreCigar(
        { ...cigar, estimatedSmokingTime: '1 Hour' },
        { preferredSmokingTimes: ['60'] },
        undefined,
        emptyBehavior,
      ).matchScore,
    ).toBe(5);
  });
  it('scores explicit taste and budget matches without treating score as probability', () => {
    const result = scoreCigar(
      cigar,
      {
        preferredStrengths: ['medium'],
        preferredWrappers: ['natural'],
        preferredFlavors: ['cocoa', 'coffee'],
        preferredOrigins: ['nicaragua'],
        favoriteBrands: ['padron'],
        minBudget: 15,
        maxBudget: 25,
      },
      20,
      emptyBehavior,
    );
    expect(result.matchScore).toBe(95);
    expect(result.matchReasons).toContain('Within your budget');
  });

  it('uses retailer price instead of MSRP and does not award unspecified budgets', () => {
    expect(
      scoreCigar(cigar, { maxBudget: 15 }, 20, emptyBehavior).matchScore,
    ).toBe(0);
    expect(scoreCigar(cigar, {}, 10, emptyBehavior).matchScore).toBe(0);
    expect(
      scoreCigar(cigar, { maxBudget: 15 }, undefined, emptyBehavior).matchScore,
    ).toBe(0);
  });

  it('uses behavior as a bounded bonus and reduces previously disliked cigars', () => {
    const behavior = {
      ...emptyBehavior,
      brands: ['Padron', 'Padron'],
      strengths: ['Medium'],
      searchTerms: ['Padron'],
    };
    expect(scoreCigar(cigar, {}, 20, behavior).matchScore).toBe(5);
    expect(
      scoreCigar(cigar, { preferredStrengths: ['medium'] }, 20, {
        ...behavior,
        dislikedCigarIds: [String(cigarId)],
      }).matchScore,
    ).toBe(20);
  });

  it('preserves leading zeros, strips injected roles, and rejects malformed scan payloads', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    await expect(
      pipe.transform(
        { code: ' 001234567890 ', retailerId },
        { type: 'body', metatype: ScanUpcDto },
      ),
    ).resolves.toMatchObject({ code: '001234567890' });
    await expect(
      pipe.transform({ code: 123 }, { type: 'body', metatype: ScanUpcDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const registration = await pipe.transform(
      {
        fullName: ' Alex ',
        email: 'ALEX@example.com',
        password: 'secret123',
        role: 'admin',
      },
      { type: 'body', metatype: CustomerRegisterDto },
    );
    expect(registration).toMatchObject({
      fullName: 'Alex',
      email: 'alex@example.com',
    });
    expect(registration).not.toHaveProperty('role');
  });

  it('validates master cigar arrays and rejects null preference arrays', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    await expect(
      pipe.transform(
        {
          brand: 'Padron',
          productLine: 'Toro',
          upcCodes: [' 00123 '],
          filler: ['Nicaragua'],
          flavorNotes: ['Cocoa'],
        },
        { type: 'body', metatype: CreateMasterDatabaseDto },
      ),
    ).resolves.toMatchObject({ upcCodes: ['00123'] });
    await expect(
      pipe.transform(
        { brand: 'Padron', productLine: 'Toro', filler: 'Nicaragua' },
        { type: 'body', metatype: CreateMasterDatabaseDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform(
        { preferredFlavors: null },
        { type: 'body', metatype: UpdateConsumerProfileDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates a partial budget edit against the saved opposite bound', async () => {
    const model = {
      findOne: jest
        .fn()
        .mockReturnValue(queryResult({ minBudget: 10, maxBudget: 20 })),
      findOneAndUpdate: jest.fn(),
    };
    const service = new ConsumerProfileService(model as never);
    await expect(
      service.updateMyProfile(userId, { minBudget: 25 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    await service.updateMyProfile(
      userId,
      { preferredFlavors: ['Coffee'] },
      true,
    );
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { userId },
      { $set: { preferredFlavors: ['Coffee'], onboardingCompleted: true } },
      expect.objectContaining({ upsert: true, runValidators: true }),
    );
  });

  it('registers only a customer and returns no password', async () => {
    const model = {
      exists: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        _id: userId,
        fullName: 'Alex',
        email: 'alex@example.com',
        role: 'customer',
        password: 'hashed',
      }),
    };
    const service = new AuthService(model as never, {} as never);
    jest
      .spyOn(service, 'login')
      .mockResolvedValue({ accessToken: 'token', user: {} } as never);
    const result = await service.registerCustomer(
      { fullName: 'Alex', email: 'ALEX@example.com', password: 'secret123' },
      {} as Response,
    );
    expect(model.create).toHaveBeenCalledWith({
      fullName: 'Alex',
      email: 'alex@example.com',
      password: 'secret123',
      role: 'customer',
    });
    expect(result.newUser).not.toHaveProperty('password');
  });

  it('converts a concurrent duplicate registration to a conflict', async () => {
    const model = {
      exists: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockRejectedValue({ code: 11000 }),
    };
    const service = new AuthService(model as never, {} as never);
    await expect(
      service.registerCustomer(
        { fullName: 'Alex', email: 'alex@example.com', password: 'secret123' },
        {} as Response,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('saves cigar state scoped to the authenticated user and records the activity', async () => {
    const model = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ rating: 5 }),
    };
    const master = { exists: jest.fn().mockResolvedValue({ _id: cigarId }) };
    const activity = { record: jest.fn() };
    const service = new ConsumerCigarService(
      model as never,
      master as never,
      activity as never,
    );
    await service.rateCigar(userId, String(cigarId), 5);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, cigarId: String(cigarId) },
      { $set: { rating: 5 } },
      expect.objectContaining({ upsert: true }),
    );
    expect(activity.record).toHaveBeenCalledWith(userId, 'rating', {
      cigarId: String(cigarId),
      rating: 5,
    });
  });

  it('resolves only approved stores from the configured frontend URL', async () => {
    const retailers = {
      findOne: jest.fn().mockReturnValue(
        queryResult({
          _id: retailerId,
          storeName: 'Demo',
          storeSlug: 'demo',
        }),
      ),
    };
    const service = new QrcodesService(
      {} as never,
      retailers as never,
      {} as never,
    );
    await expect(
      service.resolveStore(new URL('/store/demo', config.frontendUrl).href),
    ).resolves.toMatchObject({ retailerId, storeMode: true });
    expect(retailers.findOne).toHaveBeenCalledWith({
      storeSlug: 'demo',
      status: 'approved',
    });
    await expect(
      service.resolveStore('https://invalid.example/store/demo'),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.resolveStore(
        new URL('/store/demo/product/123', config.frontendUrl).href,
      ),
    ).rejects.toMatchObject({ status: 400 });
    retailers.findOne.mockReturnValue(queryResult(null));
    await expect(
      service.resolveStore(new URL('/store/missing', config.frontendUrl).href),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('looks up active master cigars with exact string UPCs and validates IDs', async () => {
    const model = { findOne: jest.fn().mockResolvedValue(cigar) };
    const service = new MasterDatabaseService(model as never, {} as never);
    await service.findByUpcCode(' 001234567890 ');
    expect(model.findOne).toHaveBeenCalledWith({
      upcCodes: '001234567890',
      status: 'active',
    });
    await expect(
      service.updateMasterDatabaseById('invalid', {}),
    ).rejects.toMatchObject({ status: 400 });
    model.findOne.mockResolvedValue(null);
    await expect(service.findByUpcCode('unknown')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('keeps multiple prices and excludes missing/inactive humidors from scan stock', async () => {
    const master = { findByUpcCode: jest.fn().mockResolvedValue(cigar) };
    const row = {
      _id: new Types.ObjectId(),
      status: 'active',
      quantity: 3,
      price: 20,
      pricePerBox: 200,
      shelfColumn: 2,
      shelfName: 'Top',
      wallName: 'Wall A',
      humidorId: { _id: new Types.ObjectId(), name: 'Main' },
    };
    const stock = {
      find: jest
        .fn()
        .mockReturnValue(
          queryResult([
            row,
            { ...row, quantity: 2, price: 22 },
            { ...row, status: 'out_of_stock', quantity: 10 },
            { ...row, humidorId: null },
          ]),
        ),
    };
    const retailers = {
      findOne: jest
        .fn()
        .mockReturnValue(queryResult({ _id: retailerId, storeName: 'Demo' })),
    };
    const service = new ConsumerScanService(
      master as never,
      stock as never,
      retailers as never,
    );
    const result = await service.scan('001234567890', retailerId);
    expect(result.store).toMatchObject({
      available: true,
      quantity: 5,
      price: 20,
      location: { humidor: 'Main', wall: 'Wall A', shelf: 'Top', column: 2 },
    });
    expect(result.store?.locations).toHaveLength(3);
    expect(result.store?.locations[1].price).toBe(22);
    await expect(service.scan('001234567890')).resolves.toMatchObject({
      store: null,
    });
  });

  it('restricts store catalog selection to available stock and retailer-owned active humidors', async () => {
    const humidorId = new Types.ObjectId();
    const master = { find: jest.fn().mockReturnValue(queryResult([cigar])) };
    const stock = {
      find: jest
        .fn()
        .mockReturnValue(queryResult([{ masterCigarId: cigarId, price: 20 }])),
    };
    const retailers = {
      exists: jest.fn().mockResolvedValue({ _id: retailerId }),
    };
    const humidors = { distinct: jest.fn().mockResolvedValue([humidorId]) };
    const service = new ConsumerCatalogService(
      master as never,
      stock as never,
      retailers as never,
      humidors as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const query = Object.assign(new CatalogQueryDto(), {
      retailerId,
      minPrice: 15,
      maxPrice: 25,
    });
    await service.getCandidates(query);
    expect(stock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        retailerId,
        humidorId: { $in: [String(humidorId)] },
        status: 'active',
        quantity: { $gt: 0 },
        price: { $gte: 15, $lte: 25 },
      }),
    );
    expect(master.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', _id: { $in: [cigarId] } }),
    );
  });

  it('recommendations use current store prices and omit stock that sells out during lookup', async () => {
    const profile = {
      getMyProfile: jest.fn().mockResolvedValue({ maxBudget: 15 }),
    };
    const state = { getAllUserStates: jest.fn().mockResolvedValue([]) };
    const activity = { getRecentActivity: jest.fn().mockResolvedValue([]) };
    const catalog = {
      getCandidates: jest.fn().mockResolvedValue({
        cigars: [cigar],
        inventory: [{ masterCigarId: cigarId, price: 20 }],
      }),
    };
    const scan = {
      getStoreAvailability: jest
        .fn()
        .mockResolvedValue({ available: true, price: 20 }),
      getCigarDetails: jest.fn().mockReturnValue({ id: cigarId }),
    };
    const master = { find: jest.fn().mockReturnValue(queryResult([])) };
    const service = new RecommendationService(
      profile as never,
      state as never,
      activity as never,
      catalog as never,
      scan as never,
      master as never,
    );
    const query = Object.assign(new RecommendationQueryDto(), { retailerId });
    const result = await service.getRecommendations(userId, query);
    expect(result.data[0]).toMatchObject({ price: 20, matchScore: 0 });
    scan.getStoreAvailability.mockResolvedValue({ available: false });
    expect((await service.getRecommendations(userId, query)).data).toEqual([]);
  });
});
