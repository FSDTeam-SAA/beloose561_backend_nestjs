# Bulk inventory and store location

All endpoints use `/api/v1`. Retailer write endpoints require a retailer access token. Retailer IDs are resolved from that token, not accepted from the request body.

## Inventory flow

1. `POST /inventory/bulk/preview`: multipart `file` and optional JSON `mapping` from column headers to field names. Canonical headers (`UPC`, `Quantity`, `Price`, `Price Per Box`, `Humidor`, `Wall`, `Shelf`, `Shelf Row`, `Column`) are mapped automatically when mapping is omitted. The first ten rows are returned in `preview`/`mappedPreview`; with automatic or explicit mapping, **all** rows are returned in `mappedRows`. Custom mappings must use actual uploaded headers: a `Barcode` mapping is invalid when the file contains `UPC`. No database writes.
2. `POST /inventory/bulk/validate`: send `{ "rows": mappedRows }`. Returns `total`, `valid`, `invalid`, and `errors` with one-based row numbers. No database writes.
3. `POST /inventory/bulk/import`: upload multipart `file` (CSV/XLSX/XLS, up to 10 MB) with optional JSON `mapping`, or send the same JSON `{ "rows": mappedRows }`. Use one input method per request. Canonical file headers are mapped automatically. Validation runs again, valid rows are upserted, and invalid rows are skipped. Returns `total`, `imported`, `failed`, and `errors`. This is a partial import, not an all-or-nothing transaction.

Direct CSV import (let curl set the multipart Content-Type boundary):

```bash
curl -X POST http://localhost:8080/api/v1/inventory/bulk/import \
  -H 'Authorization: Bearer YOUR_RETAILER_TOKEN' \
  -F 'file=@inventory.csv;type=text/csv'
```

Example body for validation and import:

```json
{
  "rows": [{
    "upc": "001234567890",
    "quantity": 10,
    "price": 15.5,
    "pricePerBox": 150,
    "humidor": "Main Humidor",
    "wall": "Wall 1",
    "shelf": "Top Shelf",
    "column": 3
  }]
}
```

- Maximum 2,000 rows per batch and 2 MB JSON body. Preview uploads allow 10 MB.
- UPC must be a string to preserve leading zeroes. Only existing active master cigars are used; imports never create master cigars.
- Quantity must be a non-negative integer. Price and pricePerBox are required non-negative numbers. Preview uses underlying numeric Excel values for stock, prices and positions, including currency-formatted cells; UPC stays text. Plain decimal strings from CSV/Excel are accepted; currency symbols and thousands separators in text cells must be removed before submitting.
- Humidor, wall and shelf names must match existing names exactly after trimming. Ambiguous names or UPCs are rejected. Only the authenticated retailer's active humidors are used.
- Wall locations need a shelf and a positive column within the wall bounds. Legacy shelf grids omit `wall` and require `row` and `column` within the grid. `shelfRow`/`shelfColumn` aliases are supported.
- Existing inventory at the same cigar/location is updated, with quantity replaced, not added. Zero quantity sets `out_of_stock`. Another cigar in that cell or a repeated cell in the batch is rejected.
- Confirmed database row failures are returned as row errors. Connection/write-concern failures remain request errors because the final write outcome cannot be guaranteed.
- Occupancy checks are performed before writing. The existing inventory schema has no unique cell index, so simultaneous imports/manual writes can race. Serialize inventory imports for a retailer; a database uniqueness migration requires auditing existing duplicate cells first.

## Store location

The existing controller prefix is singular: `/retailer`.

`PATCH /retailer/me/location` with a retailer token:

```json
{ "latitude": 23.8103, "longitude": 90.4125 }
```

Stored as GeoJSON `[longitude, latitude]`. Latitude is bounded to -90..90 and longitude to -180..180. Location remains optional for existing retailers.

`GET /retailer/nearby?lat=23.8103&lng=90.4125&radius=5000&page=1&limit=20` is public. It returns only approved, geolocated stores, nearest first, with distance in meters and pagination metadata. Radius defaults to 5,000 meters (maximum 100,000); limit defaults to 20 (maximum 100).

The retailer schema declares a `location: '2dsphere'` index. Ensure it has been created before querying nearby stores if automatic index creation is disabled in the deployment. Real geospatial execution requires MongoDB; the automated tests cover request validation, schema validation and query construction without a live database.
