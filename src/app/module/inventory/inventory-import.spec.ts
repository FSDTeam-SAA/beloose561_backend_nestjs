import { ValidationPipe } from '@nestjs/common';
import { mongo, Types } from 'mongoose';
import { InventoryService } from './inventory.service';
import { BulkInventoryValidateDto } from './dto/bulk-inventory.dto';

jest.mock('../notifation/notifation.service', () => ({
  NotifationService: class {},
}));

describe('Bulk inventory validation and import', () => {
  const userId = new Types.ObjectId();
  const retailerId = new Types.ObjectId();
  const masterId = new Types.ObjectId();
  const humidorId = new Types.ObjectId();
  const wallId = new Types.ObjectId();
  const shelfId = new Types.ObjectId();
  const row = {
    upc: '00123',
    quantity: '2',
    price: '10.50',
    pricePerBox: '100',
    humidor: 'Room',
    wall: 'Wall',
    shelf: 'Top',
    column: '2',
  };
  let service: InventoryService;
  let inventory: { find: jest.Mock; bulkWrite: jest.Mock };
  let retailer: { findOne: jest.Mock };
  let master: { find: jest.Mock };
  let humidor: { find: jest.Mock };
  let existing: Record<string, unknown>[];
  beforeEach(() => {
    existing = [];
    inventory = {
      find: jest.fn(() => ({
        select: () => ({ lean: () => Promise.resolve(existing) }),
      })),
      bulkWrite: jest
        .fn()
        .mockResolvedValue({ matchedCount: 0, upsertedCount: 1 }),
    };
    retailer = { findOne: jest.fn().mockResolvedValue({ _id: retailerId }) };
    master = {
      find: jest.fn(() => ({
        lean: () =>
          Promise.resolve([
            {
              _id: masterId,
              upcCodes: ['00123'],
              productLine: 'Cigar',
              brand: 'Brand',
            },
          ]),
      })),
    };
    humidor = {
      find: jest.fn(() => ({
        lean: () =>
          Promise.resolve([
            {
              _id: humidorId,
              name: 'Room',
              walls: [
                {
                  _id: wallId,
                  name: 'Wall',
                  columns: 3,
                  shelves: [{ _id: shelfId, name: 'Top' }],
                },
              ],
              shelfes: [{ name: 'Legacy', rows: 2, columns: 3 }],
            },
          ]),
      })),
    };
    service = Object.assign(Object.create(InventoryService.prototype), {
      inventoryRepository: inventory,
      retailerModel: retailer,
      masterDatabaseModel: master,
      humidorModel: humidor,
      userModel: {
        findById: jest.fn().mockResolvedValue({ _id: userId }),
        findByIdAndUpdate: jest.fn(),
      },
    }) as InventoryService;
  });
  it('validates without writes and scopes locations to the authenticated retailer', async () => {
    expect(
      await service.validateBulkInventory(String(userId), { rows: [row] }),
    ).toEqual({ total: 1, valid: 1, invalid: 0, errors: [] });
    expect(inventory.bulkWrite).not.toHaveBeenCalled();
    expect(retailer.findOne).toHaveBeenCalledWith({ userId });
    expect(humidor.find).toHaveBeenCalledWith({
      userId,
      retailerId,
      isActive: true,
    });
    expect(master.find).toHaveBeenCalledWith({
      upcCodes: { $in: ['00123'] },
      status: 'active',
    });
  });
  it.each([
    [{ upc: 'unknown' }, 'UPC not found'],
    [{ price: '' }, 'Price must'],
    [{ quantity: -1 }, 'Quantity must'],
    [{ quantity: 1.5 }, 'Quantity must'],
    [{ pricePerBox: undefined }, 'Price per box'],
    [{ humidor: 'Other retailer room' }, 'Humidor not found'],
    [{ wall: 'Missing' }, 'Wall not found'],
    [{ shelf: 'Missing' }, 'Shelf not found'],
    [{ column: 4 }, 'Column exceeds'],
    [{ column: true }, 'Column must'],
  ])('reports invalid cells as row errors: %j', async (override, reason) => {
    const dto = { rows: [{ ...row, ...override }] } as BulkInventoryValidateDto;
    const result = await service.importBulkInventory(String(userId), dto);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toMatchObject({
      row: 1,
      reason: expect.stringContaining(reason),
    });
    expect(inventory.bulkWrite).not.toHaveBeenCalled();
  });
  it('upserts valid rows with resolved IDs and replaces zero stock; rejects duplicate cells', async () => {
    const result = await service.importBulkInventory(String(userId), {
      rows: [{ ...row, quantity: 0 }, row],
    });
    expect(result).toMatchObject({ imported: 1, failed: 1 });
    const operation = inventory.bulkWrite.mock.calls[0][0][0].updateOne;
    expect(operation.filter).toMatchObject({
      retailerId,
      masterCigarId: masterId,
      humidorId,
      wallId,
      shelfId,
      shelfColumn: 2,
    });
    expect(operation.update.$set).toMatchObject({
      userId,
      quantity: 0,
      price: 10.5,
      pricePerBox: 100,
      status: 'out_of_stock',
      name: 'Cigar',
    });
    expect(operation.upsert).toBe(true);
  });
  it('permits updating the same cigar but rejects another cigar in an occupied cell', async () => {
    existing.push({
      humidorId,
      wallId,
      shelfId,
      shelfColumn: 2,
      masterCigarId: masterId,
    });
    expect(
      (await service.validateBulkInventory(String(userId), { rows: [row] }))
        .valid,
    ).toBe(1);
    existing[0].masterCigarId = new Types.ObjectId();
    expect(
      (await service.validateBulkInventory(String(userId), { rows: [row] }))
        .errors[0].reason,
    ).toContain('occupied');
  });
  it('supports legacy grids and enforces row bounds', async () => {
    const legacy = { ...row, wall: '', shelf: 'Legacy', row: '2' };
    expect(
      (await service.validateBulkInventory(String(userId), { rows: [legacy] }))
        .valid,
    ).toBe(1);
    expect(
      (
        await service.validateBulkInventory(String(userId), {
          rows: [{ ...legacy, row: '3' }],
        })
      ).invalid,
    ).toBe(1);
  });
  it('preserves cells through the global pipe while rejecting invalid batch structure', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const metadata = {
      type: 'body' as const,
      metatype: BulkInventoryValidateDto,
    };
    expect(
      (await pipe.transform({ rows: [row], retailerId: 'spoof' }, metadata))
        .rows[0],
    ).toEqual(row);
    await expect(pipe.transform({ rows: [null] }, metadata)).rejects.toThrow();
    await expect(pipe.transform({ rows: [] }, metadata)).rejects.toThrow();
  });

  it('reports confirmed write failures with the original row number', async () => {
    const failure = Object.assign(
      Object.create(mongo.MongoBulkWriteError.prototype),
      {
        result: {
          matchedCount: 0,
          upsertedCount: 1,
          getWriteConcernError: () => undefined,
          getWriteErrors: () => [{ index: 1 }],
        },
      },
    );
    inventory.bulkWrite.mockRejectedValueOnce(failure);
    const result = await service.importBulkInventory(String(userId), {
      rows: [row, { ...row, column: '3' }],
    });
    expect(result).toMatchObject({
      imported: 1,
      failed: 1,
      errors: [{ row: 2, upc: '00123' }],
    });
  });

  it('propagates unknown database failures instead of reporting success', async () => {
    inventory.bulkWrite.mockRejectedValueOnce(new Error('Connection lost'));
    await expect(
      service.importBulkInventory(String(userId), { rows: [row] }),
    ).rejects.toThrow('Connection lost');
  });
});
