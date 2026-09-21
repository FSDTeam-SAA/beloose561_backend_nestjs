import * as XLSX from 'xlsx';
import { InventoryService } from './inventory.service';

jest.mock('../notifation/notifation.service', () => ({
  NotifationService: class {},
}));

describe('Inventory bulk flow', () => {
  const master = {
    _id: 'master',
    upcCodes: ['001234567890'],
    brand: 'Brand',
    productLine: 'Line',
  };
  const humidor = {
    _id: 'humidor',
    name: 'Main',
    walls: [
      {
        _id: 'wall',
        name: 'A',
        columns: 10,
        shelves: [{ _id: 'shelf', name: 'Top' }],
      },
    ],
  };
  const row = {
    upc: '001234567890',
    quantity: 12,
    price: 13,
    pricePerBox: 120,
    humidor: 'Main',
    wall: 'A',
    shelf: 'Top',
    column: 3,
  };
  const existing = jest.fn();
  const bulkWrite = jest.fn();
  const inventory = {
    find: () => ({ select: () => ({ lean: existing }) }),
    bulkWrite,
  };
  const users = {
    findById: jest.fn().mockResolvedValue({ _id: 'user' }),
    findByIdAndUpdate: jest.fn(),
  };
  const retailers = {
    findOne: jest.fn().mockResolvedValue({ _id: 'retailer' }),
  };
  const masters = {
    find: jest.fn(() => ({ lean: () => Promise.resolve([master]) })),
  };
  const humidors = {
    find: jest.fn(() => ({ lean: () => Promise.resolve([humidor]) })),
  };
  const service = new InventoryService(
    ...([
      inventory,
      users,
      retailers,
      masters,
      humidors,
      {},
    ] as unknown as ConstructorParameters<typeof InventoryService>),
  );
  function file(
    headers: string[] = [
      'UPC',
      'Quantity',
      'Price',
      'Price Per Box',
      'Humidor',
      'Wall',
      'Shelf',
      'Shelf Row',
      'Column',
    ],
  ) {
    const sheet = XLSX.utils.aoa_to_sheet([
      headers,
      ['001234567890', 12, 13, 120, 'Main', 'A', 'Top', 1, 3],
    ]);
    sheet.C2.z = '$0.00';
    sheet.D2.z = '$0.00';
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Inventory');
    return {
      originalname: 'inventory.xlsx',
      buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    } as Express.Multer.File;
  }
  beforeEach(() => {
    existing.mockResolvedValue([]);
    bulkWrite
      .mockReset()
      .mockResolvedValue({ matchedCount: 0, upsertedCount: 1 });
  });

  it('auto-maps canonical Excel and imports numeric currency cells with UPC zeros intact', async () => {
    const preview = service.previewBulkInventory(file(), {});
    expect(preview.mappedRows?.[0]).toEqual({ ...row, shelfRow: 1 });
    expect(preview.preview[0].Price).toBe('$13.00');
    expect(
      await service.validateBulkInventory('user', {
        rows: preview.mappedRows! as unknown as (typeof row)[],
      }),
    ).toMatchObject({ valid: 1, invalid: 0 });
    expect(
      await service.importBulkInventory('user', { rows: [row] }),
    ).toMatchObject({ imported: 1, failed: 0 });
    expect(bulkWrite.mock.calls[0][0][0].updateOne.update.$set).toMatchObject({
      masterCigarId: 'master',
      quantity: 12,
      price: 13,
      pricePerBox: 120,
      status: 'active',
    });
  });
  it('rejects stale explicit mappings and supports custom headers', () => {
    expect(() =>
      service.previewBulkInventory(file(), {
        mapping: { Barcode: 'upc', Qty: 'quantity', 'Retail Price': 'price' },
      }),
    ).toThrow('Unknown column: Barcode');
    const result = service.previewBulkInventory(
      file([
        'Barcode',
        'Qty',
        'Retail Price',
        'Box',
        'Humidor',
        'Wall',
        'Shelf',
        'Row',
        'Column',
      ]),
      { mapping: { Barcode: 'upc', Qty: 'quantity', 'Retail Price': 'price' } },
    );
    expect(result.mappedRows?.[0]).toEqual({
      upc: row.upc,
      quantity: 12,
      price: 13,
    });
  });
  it.each([
    [{ upc: 'unknown' }, 'UPC not found'],
    [{ humidor: 'Wrong' }, 'Humidor not found'],
    [{ wall: 'Wrong' }, 'Wall not found'],
    [{ shelf: 'Wrong' }, 'Shelf not found'],
    [{ quantity: -1 }, 'Quantity must'],
    [{ price: -1 }, 'Price must'],
    [{ pricePerBox: -1 }, 'Price per box must'],
  ])('rejects invalid row %j without writes', async (change, reason) => {
    const result = await service.importBulkInventory('user', {
      rows: [{ ...row, ...change }],
    });
    expect(result.failed).toBe(1);
    expect(result.errors[0].reason).toContain(reason);
    expect(bulkWrite).not.toHaveBeenCalled();
  });
  it('rejects another cigar in an occupied physical cell', async () => {
    existing.mockResolvedValue([
      {
        humidorId: 'humidor',
        wallId: 'wall',
        shelfId: 'shelf',
        shelfColumn: 3,
        masterCigarId: 'other',
      },
    ]);
    expect(
      (await service.validateBulkInventory('user', { rows: [row] })).errors[0]
        .reason,
    ).toContain('occupied');
  });
  it('allows the same cigar at different columns and marks zero stock', async () => {
    bulkWrite.mockResolvedValue({ matchedCount: 0, upsertedCount: 2 });
    expect(
      await service.importBulkInventory('user', {
        rows: [row, { ...row, column: 4, quantity: 0 }],
      }),
    ).toMatchObject({ imported: 2, failed: 0 });
    expect(bulkWrite.mock.calls[0][0][1].updateOne.update.$set.status).toBe(
      'out_of_stock',
    );
    expect(humidors.find).toHaveBeenCalledWith({
      userId: 'user',
      retailerId: 'retailer',
      isActive: true,
    });
  });
  it('rejects repeated cells within a batch', async () => {
    expect(
      (await service.validateBulkInventory('user', { rows: [row, row] }))
        .errors[0].reason,
    ).toContain('Duplicate shelf cell');
  });

  it('imports a CSV upload directly and preserves UPC leading zeros', async () => {
    const csv = {
      originalname: 'inventory.csv',
      buffer: Buffer.from(
        'UPC,Quantity,Price,Price Per Box,Humidor,Wall,Shelf,Column\n001234567890,12,13,120,Main,A,Top,3',
      ),
    } as Express.Multer.File;
    expect(await service.importBulkInventory('user', {}, csv)).toMatchObject({
      imported: 1,
      failed: 0,
    });
    expect(masters.find).toHaveBeenLastCalledWith({
      upcCodes: { $in: ['001234567890'] },
      status: 'active',
    });
  });

  it('imports Excel uploads directly', async () => {
    expect(await service.importBulkInventory('user', {}, file())).toMatchObject(
      { imported: 1, failed: 0 },
    );
  });

  it('rejects missing or ambiguous input before writing', async () => {
    await expect(service.importBulkInventory('user', {})).rejects.toThrow(
      'Upload a CSV/Excel file or provide rows',
    );
    await expect(
      service.importBulkInventory('user', { rows: [row] }, file()),
    ).rejects.toThrow('either a file or rows');
    expect(bulkWrite).not.toHaveBeenCalled();
  });
});
