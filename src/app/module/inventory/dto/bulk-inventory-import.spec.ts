import { ValidationPipe } from '@nestjs/common';
import { BulkInventoryImportDto } from './bulk-inventory.dto';

describe('Bulk import request validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const parse = (body: unknown): Promise<BulkInventoryImportDto> =>
    pipe.transform(body, {
      type: 'body',
      metatype: BulkInventoryImportDto,
    }) as Promise<BulkInventoryImportDto>;

  it.each(['', '   '])(
    'accepts empty optional multipart fields (%j)',
    async (empty) => {
      const dto = await parse({ rows: empty, mapping: empty });
      expect(dto.rows).toBeUndefined();
      expect(dto.mapping).toBeUndefined();
    },
  );
  it('accepts file-only bodies', async () => {
    expect((await parse({})).rows).toBeUndefined();
  });
  it('preserves JSON rows and parses custom mappings', async () => {
    const rows = [{ upc: '001234567890', quantity: 12 }];
    expect((await parse({ rows })).rows).toEqual(rows);
    expect((await parse({ mapping: '{"UPC":"upc"}' })).mapping).toEqual({
      UPC: 'upc',
    });
  });
  it.each([
    'invalid',
    '[]',
    {},
    [],
    [1],
    Array.from({ length: 2001 }, () => ({})),
  ])('rejects invalid nonempty rows input', async (rows) => {
    await expect(parse({ rows })).rejects.toThrow();
  });
  it('rejects malformed mapping', async () => {
    await expect(parse({ mapping: 'invalid' })).rejects.toThrow(
      'Mapping must be a valid JSON object',
    );
  });
});
