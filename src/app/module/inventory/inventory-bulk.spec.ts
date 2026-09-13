import * as XLSX from 'xlsx';
import { InventoryService } from './inventory.service';

jest.mock('../notifation/notifation.service', () => ({
  NotifationService: class {},
}));

describe('Inventory bulk preview', () => {
  const service = Object.create(InventoryService.prototype) as InventoryService;
  const csv = (text: string) => ({
    originalname: 'inventory.csv', buffer: Buffer.from(text),
  }) as Express.Multer.File;
  const mapping = { Barcode: 'upc', Qty: 'quantity', Price: 'price' } as const;

  it('preserves CSV barcodes and maps retailer columns', () => {
    const result = service.previewBulkInventory(csv('Barcode,Qty,Price\n0012345,12,13'), { mapping });
    expect(result.totalRows).toBe(1);
    expect(result.mappedPreview).toEqual([{ upc: '0012345', quantity: '12', price: '13' }]);
  });

  it('preserves formatted Excel barcodes', () => {
    const sheet = XLSX.utils.aoa_to_sheet([['Barcode', 'Qty', 'Price'], [123, 2, 10]]);
    sheet.A2.z = '000000';
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Inventory');
    const file = { originalname: 'inventory.xlsx', buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) } as Express.Multer.File;
    expect(service.previewBulkInventory(file, { mapping }).mappedPreview?.[0].upc).toBe('000123');
  });

  it('limits previews to ten rows while reporting the total', () => {
    const file = csv('Barcode,Qty,Price\n' + Array(12).fill('001,1,2').join('\n'));
    const result = service.previewBulkInventory(file, {});
    expect(result.totalRows).toBe(12);
    expect(result.preview).toHaveLength(10);
  });

  it('rejects ambiguous headers and invalid mappings', () => {
    expect(() => service.previewBulkInventory(csv('Qty,Qty\n1,2'), {})).toThrow('unique');
    const file = csv('Barcode,Qty,Price\n001,1,2');
    expect(() => service.previewBulkInventory(file, { mapping: { Wrong: 'upc' } })).toThrow('Unknown column');
    expect(() => service.previewBulkInventory(file, { mapping: { Barcode: 'upc' } })).toThrow('must include');
    expect(() => service.previewBulkInventory(file, { mapping: { Barcode: 'upc', Qty: 'upc' } })).toThrow('only once');
  });

  it('rejects empty files and excessive row counts', () => {
    expect(() => service.previewBulkInventory(csv('Barcode,Qty,Price'), {})).toThrow('data rows');
    expect(() => service.previewBulkInventory(csv('Barcode\n' + Array(2001).fill('001').join('\n')), {})).toThrow('2000');
  });
});
