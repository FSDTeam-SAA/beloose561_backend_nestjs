import { ValidationPipe } from '@nestjs/common';
import { model } from 'mongoose';
import { RetailerService } from './retailer.service';
import { RetailerSchema } from './entities/retailer.entity';
import {
  NearbyRetailersDto,
  UpdateRetailerLocationDto,
} from './dto/retailer-location.dto';

jest.mock('../notifation/notifation.service', () => ({
  NotifationService: class {},
}));

describe('Retailer GPS and nearby stores', () => {
  it('saves longitude first using the authenticated user', async () => {
    const findOneAndUpdate = jest.fn().mockResolvedValue({
      location: { type: 'Point', coordinates: [90, 23] },
    });
    const service = Object.assign(Object.create(RetailerService.prototype), {
      retailerModel: { findOneAndUpdate },
    }) as RetailerService;
    await service.updateLocation('user', { latitude: 23, longitude: 90 });
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user' },
      { $set: { location: { type: 'Point', coordinates: [90, 23] } } },
      { new: true, runValidators: true },
    );
  });
  it('validates coordinates, query defaults and pagination', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    const meta = { type: 'query' as const, metatype: NearbyRetailersDto };
    expect(await pipe.transform({ lat: '0', lng: '0' }, meta)).toMatchObject({
      lat: 0,
      lng: 0,
      radius: 5000,
      page: 1,
      limit: 20,
    });
    for (const override of [
      { lat: '' },
      { lng: 181 },
      { page: 0 },
      { radius: -1 },
      { limit: 101 },
    ]) {
      await expect(
        pipe.transform({ lat: '23', lng: '90', ...override }, meta),
      ).rejects.toThrow();
    }
    await expect(
      pipe.transform(
        { latitude: 91, longitude: 90 },
        { type: 'body', metatype: UpdateRetailerLocationDto },
      ),
    ).rejects.toThrow();
  });
  it('filters approved stores and paginates without exposing private fields', async () => {
    const aggregate = jest
      .fn()
      .mockResolvedValue([
        { count: [{ total: 3 }], data: [{ storeName: 'Store' }] },
      ]);
    const service = Object.assign(Object.create(RetailerService.prototype), {
      retailerModel: { aggregate },
    }) as RetailerService;
    const result = await service.nearby({
      lat: 23,
      lng: 90,
      radius: 5000,
      page: 2,
      limit: 1,
    });
    expect(result.meta).toEqual({ page: 2, limit: 1, total: 3 });
    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[0].$geoNear).toMatchObject({
      query: { status: 'approved' },
      near: { type: 'Point', coordinates: [90, 23] },
      maxDistance: 5000,
    });
    expect(pipeline[2].$facet.data[0]).toEqual({ $skip: 1 });
    expect(pipeline[2].$facet.data[2].$project.userId).toBeUndefined();
  });
  it('keeps GPS optional and validates GeoJSON at the schema boundary', () => {
    const Retailer = model('RetailerLocationTest', RetailerSchema);
    expect(new Retailer({}).validateSync()).toBeUndefined();
    expect(
      new Retailer({
        location: { type: 'Point', coordinates: [90, 23] },
      }).validateSync(),
    ).toBeUndefined();
    expect(
      new Retailer({
        location: { type: 'Point', coordinates: [90, 123] },
      }).validateSync(),
    ).toBeDefined();
    expect(RetailerSchema.indexes()).toContainEqual([
      { location: '2dsphere' },
      {},
    ]);
  });
});
