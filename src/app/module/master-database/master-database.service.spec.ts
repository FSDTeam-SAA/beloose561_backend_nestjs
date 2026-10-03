import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { MasterDatabaseService } from './master-database.service';
import {
  MasterDatabaseDocument,
  MasterDatabaseSchema,
} from './entities/master-database.entity';
import { InventoryDocument } from '../inventory/entities/inventory.entity';

describe('Admin master upload', () => {
  const bulkWrite = jest.fn();
  const service = new MasterDatabaseService(
    { bulkWrite } as unknown as Model<MasterDatabaseDocument>,
    {} as Model<InventoryDocument>,
  );
  function file(rows: Record<string, unknown>[]) {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Admin');
    return {
      buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    } as Express.Multer.File;
  }
  beforeEach(() => {
    bulkWrite.mockReset().mockResolvedValue({ upsertedCount: 1 });
  });

  it('persists all template columns and preserves text UPC zeros', async () => {
    await service.uploadBulkMasterDatabase(
      file([
        {
          'Cigar Name': 'Plasencia Alma Fuerte',
          Brand: 'Plasencia',
          'Product Line': 'Alma Fuerte',
          Manufacturer: 'Plasencia',
          'Country of Origin': 'Nicaragua',
          'Origin Region': 'Esteli',
          'UPC Codes': '001234567890|008765432101',
          Images: 'https://example.com/cigar.jpg',
          Thumbnail: 'https://example.com/thumb.jpg',
          Strength: 'full',
          Wrapper: 'Shade',
          Binder: 'Nicaraguan',
          Filler: 'Nicaraguan, Dominican| ',
          Vitola: 'Toro',
          Size: '6 x 54',
          Length: 6,
          'Ring Gauge': 54,
          'Estimated Smoking Time': 90,
          'Flavor Profiles': 'Coffee|Cocoa, Pepper',
          'Tasting Notes': 'Rich, earthy',
          'Pairing Suggestions': 'Añejo Tequila|Vintage Port',
          Description: 'Description',
          "Why You'll Like This": 'Rich flavor',
          'Suggested Retail Price Each': '$23.00',
          'Suggested Retail Price Per Box': '$230.00',
          Status: 'inactive',
        },
      ]),
    );
    const entry = bulkWrite.mock.calls[0][0][0].updateOne.update.$setOnInsert;
    expect(entry).toEqual({
      name: 'Plasencia Alma Fuerte',
      brand: 'Plasencia',
      productLine: 'Alma Fuerte',
      manufacturer: 'Plasencia',
      country: 'Nicaragua',
      originRegion: 'Esteli',
      upcCodes: ['001234567890', '008765432101'],
      image: 'https://example.com/cigar.jpg',
      thumbnail: 'https://example.com/thumb.jpg',
      strength: 'full',
      wrapper: 'Shade',
      binder: 'Nicaraguan',
      filler: ['Nicaraguan', 'Dominican'],
      vitola: 'Toro',
      size: '6 x 54',
      length: '6',
      ringGauge: 54,
      estimatedSmokingTime: '90',
      flavorNotes: ['Coffee', 'Cocoa', 'Pepper'],
      tastingNotes: 'Rich, earthy',
      pairingSuggestions: ['Añejo Tequila', 'Vintage Port'],
      description: 'Description',
      whyYoullLikeThis: 'Rich flavor',
      suggestedRetailPriceEach: 23,
      suggestedRetailPricePerBox: 230,
      available: true,
      status: 'inactive',
    });
    for (const key of Object.keys(entry))
      expect(MasterDatabaseSchema.path(key)).toBeDefined();
  });

  it('keeps legacy aliases, defaults and duplicate skip behavior', async () => {
    bulkWrite.mockResolvedValue({ upsertedCount: 0 });
    const result = await service.uploadBulkMasterDatabase(
      file([
        {
          brand: 'Brand',
          productLine: 'Line',
          pairingSuggestions: 'Coffee, Rum',
          'suggested retail price (box)': 100,
        },
        { brand: 'Missing product' },
        { brand: 'Brand', productLine: 'Bad status', status: 'unknown' },
        { brand: 'Brand', productLine: 'Bad gauge', ringGauge: 'abc' },
      ]),
    );
    expect(result).toEqual({
      totalRows: 4,
      insertedCount: 0,
      duplicateSkippedCount: 1,
      invalidCount: 3,
    });
    expect(
      bulkWrite.mock.calls[0][0][0].updateOne.update.$setOnInsert,
    ).toMatchObject({
      status: 'active',
      upcCodes: [],
      pairingSuggestions: ['Coffee', 'Rum'],
      suggestedRetailPricePerBox: 100,
    });
  });
});
