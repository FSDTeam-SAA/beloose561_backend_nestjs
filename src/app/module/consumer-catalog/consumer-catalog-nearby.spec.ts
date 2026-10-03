import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConsumerCatalogService } from './consumer-catalog.service';
import {
  NearbyCatalogQueryDto,
  NearbyStockQueryDto,
} from './dto/nearby-catalog-query.dto';

describe('ConsumerCatalogService nearby stock', () => {
  const cigarId = new Types.ObjectId();
  const nearRetailerId = new Types.ObjectId();
  const farRetailerId = new Types.ObjectId();
  const nearHumidorId = new Types.ObjectId();
  const farHumidorId = new Types.ObjectId();
  const wallId = new Types.ObjectId();
  const shelfId = new Types.ObjectId();
  const cigar = {
    _id: cigarId,
    brand: 'Example',
    productLine: 'Reserve',
    strength: 'medium',
    country: 'Nicaragua',
    available: false,
  };

  let inventoryFilter: Record<string, unknown>;
  let retailerPipeline: Record<string, unknown>[];
  let service: ConsumerCatalogService;

  beforeEach(() => {
    const masterPageQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([cigar]),
    };
    const masterModel = {
      find: jest.fn(() => masterPageQuery),
      countDocuments: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue({ _id: cigarId }),
    };
    const inventory = [
      {
        _id: new Types.ObjectId(),
        retailerId: farRetailerId,
        masterCigarId: cigarId,
        humidorId: farHumidorId,
        shelfName: 'Far shelf',
        shelfColumn: 1,
        quantity: 4,
        price: 8,
        pricePerBox: 160,
      },
      {
        _id: new Types.ObjectId(),
        retailerId: nearRetailerId,
        masterCigarId: cigarId,
        humidorId: nearHumidorId,
        wallId,
        shelfId,
        shelfName: 'Fallback shelf',
        shelfColumn: 2,
        quantity: 2,
        price: 12,
        pricePerBox: 240,
      },
      {
        _id: new Types.ObjectId(),
        retailerId: nearRetailerId,
        masterCigarId: cigarId,
        humidorId: nearHumidorId,
        shelfName: 'Second shelf',
        shelfColumn: 3,
        quantity: 3,
        price: 14,
        pricePerBox: 280,
      },
    ];
    const inventoryQuery = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(inventory),
    };
    const inventoryModel = {
      find: jest.fn((filter: Record<string, unknown>) => {
        inventoryFilter = filter;
        return inventoryQuery;
      }),
    };
    const retailerModel = {
      aggregate: jest.fn((pipeline: Record<string, unknown>[]) => {
        retailerPipeline = pipeline;
        return Promise.resolve([
          {
            _id: nearRetailerId,
            storeName: 'Near Store',
            storeSlug: 'near-store',
            distance: 100,
          },
          {
            _id: farRetailerId,
            storeName: 'Far Store',
            storeSlug: 'far-store',
            distance: 200,
          },
        ]);
      }),
    };
    const humidorQuery = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: nearHumidorId,
          retailerId: nearRetailerId,
          name: 'Walk-in',
          walls: [
            {
              _id: wallId,
              name: 'Left wall',
              shelves: [{ _id: shelfId, name: 'Top shelf' }],
            },
          ],
        },
        {
          _id: farHumidorId,
          retailerId: farRetailerId,
          name: 'Main Humidor',
          walls: [],
        },
      ]),
    };
    const humidorModel = { find: jest.fn(() => humidorQuery) };
    const scanService = {
      getCigarDetails: jest.fn((value: Record<string, unknown>) => value),
    };

    service = new ConsumerCatalogService(
      masterModel as never,
      inventoryModel as never,
      retailerModel as never,
      humidorModel as never,
      scanService as never,
      {} as never,
      { record: jest.fn() } as never,
    );
  });

  it('returns only live nearby stock and chooses the nearest retailer', async () => {
    const query = Object.assign(new NearbyCatalogQueryDto(), {
      lat: 23.8,
      lng: 90.4,
      minPrice: 5,
      maxPrice: 15,
      search: 'Reserve',
    });

    const result = await service.discoverNearby(query);

    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    expect(result.data[0]).toMatchObject({
      available: true,
      store: {
        retailerId: nearRetailerId,
        storeName: 'Near Store',
        storeSlug: 'near-store',
        distance: 100,
        price: 12,
        pricePerBox: 240,
        quantity: 5,
      },
    });
    expect(inventoryFilter).toMatchObject({
      status: 'active',
      quantity: { $gt: 0 },
      price: { $gte: 5, $lte: 15 },
    });
    expect(retailerPipeline[0]).toEqual({
      $geoNear: expect.objectContaining({
        near: { type: 'Point', coordinates: [90.4, 23.8] },
        maxDistance: 5000,
        query: { status: 'approved' },
      }),
    });
  });

  it('returns one distance-sorted entry per retailer with a resolved location', async () => {
    const query = Object.assign(new NearbyStockQueryDto(), {
      lat: 23.8,
      lng: 90.4,
    });

    const result = await service.getNearbyStock(String(cigarId), query);

    expect(result.meta).toEqual({ page: 1, limit: 10, total: 2 });
    expect(result.data.map((item) => item.storeName)).toEqual([
      'Near Store',
      'Far Store',
    ]);
    expect(result.data[0]).toMatchObject({
      quantity: 5,
      available: true,
      location: {
        humidor: 'Walk-in',
        wall: 'Left wall',
        shelf: 'Top shelf',
        column: 2,
      },
    });
  });

  it('returns 404 for a malformed master cigar id', async () => {
    await expect(
      service.getNearbyStock(
        'not-an-id',
        Object.assign(new NearbyStockQueryDto(), { lat: 23.8, lng: 90.4 }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
