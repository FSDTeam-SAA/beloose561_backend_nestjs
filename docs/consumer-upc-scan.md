# Consumer UPC scan — milestone 1

All routes below use the `/api/v1` prefix. These read-only catalog/scan routes are public, like the existing master catalog. Master writes remain admin-only.

## Prepare demo data

1. Create or update a master cigar through the existing admin endpoints. Send `upcCodes` as an array of strings, e.g. `["001234567890"]`, and set `status` to `active`. The create endpoint accepts JSON. Preserve leading zeros; UPCs are identifiers, not numbers.
2. Use the existing inventory flow to link `masterCigarId` to an approved retailer and active humidor. Set wall, shelf, column, quantity, price and box price. Do not create another master record for another store or shelf.
3. Ensure that the barcode is assigned to the intended master cigar. The UPC index is not unique; existing ambiguous catalog data needs correction before demonstrating scans.

## Endpoints

- `GET /api/v1/master-database/upc/001234567890`: active master lookup.
- `GET /api/v1/consumer/scans/upc/001234567890?retailerId=RETAILER_OBJECT_ID`: combined lookup.
- `POST /api/v1/consumer/scans/upc` with JSON:

```json
{
  "code": "001234567890",
  "retailerId": "507f1f77bcf86cd799439011"
}
```

Omit `retailerId` for catalog-only lookup (`data.store` is `null`). A missing active cigar returns 404; invalid retailer IDs return 400; missing or unapproved retailers return 404.

`data.store` includes `available`, total sellable `quantity`, `price`, `pricePerBox`, `location`, and `locations`. Every location includes its inventory ID, quantity, price and Humidor → Wall → Shelf → Column. Current wall/shelf names take precedence over stored inventory labels.

The top-level price/location belongs to the first in-stock inventory record (stable ID order), or the first visible record if none is in stock. Use `locations` when stock spans multiple shelves or prices differ. Prices are the recorded regular inventory prices; promotional pricing is not calculated here.

Only active/out-of-stock inventory in active, retailer-owned humidors is exposed. Out-of-stock rows have zero sellable quantity even if their stored count is stale. No matching inventory returns `available: false`, quantity `0`, null price/location and an empty locations array. Inactive and under-review inventory is excluded.

The master smoking-time field remains `estimatedSmokingTime` for compatibility. Existing retailer discovery now reads and normalizes that field instead of querying a nonexistent master `smokingTime` field.

## Validation

`npm test -- --runInBand` covers UPC normalization, DTO validation, retailer visibility, missing stock, multiple locations and public response projection. `npm run build` verifies compilation. These tests mock database queries; a live MongoDB/device scan demo still requires the data setup above.

Customer registration, profiles, QR resolution and recommendations are now implemented. See [the consumer backend guide](consumer-backend-guide-bn.md) for both demo flows. Journal, inventory imports, geo search and image recognition remain later work.
