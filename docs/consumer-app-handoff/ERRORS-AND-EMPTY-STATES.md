# Error, null and empty response behavior

Examples source-derived. Production error wording varies by controller/validation/error handler; use message/errorSources rather than exact string matching.

## No profile yet: successful null

```json
{"statusCode":200,"success":true,"message":"Taste profile retrieved successfully","data":null}
```

Show onboarding, not connection error. GET may have no top-level meta.

## Empty catalog / saved state

```json
{"statusCode":200,"success":true,"message":"Cigars retrieved successfully","meta":{"page":1,"limit":20,"total":0},"data":[]}
```

Stop load-more when displayed count >= total. Empty search has reset/clear filters action.

## Empty feature section

```json
{"statusCode":200,"success":true,"message":"Staff picks retrieved successfully","data":{"count":0,"data":[],"groupedByStaff":{}}}
```

Feature items nested in data.data. Render empty section, not fake cards.

## No selected shop

Catalog `available:null` and suggested price. Master detail `storeAvailability:null`. Scan `store:null`. Do not show Not available or a false shop name; prompt actual shop selection.

## Shop exists but cigar not stocked

Source availability can return `available:false`, `quantity:0`, `price:null`, `pricePerBox:null`, `location:null`, `locations:[]`. A persisted out-of-stock location may appear with available:false and sellable quantity0. Handle both. Details of inactive master return404 before shop lookup.

## Surprise Me end state

Source returns limitReached:true with explanatory fields when exclusion count reaches its limit or no candidates remain. Read limitReached before accessing item; do not assume tries counter is a persistent per-user daily session (current method receives exclude IDs).

## Error envelope

```json
{"success":false,"statusCode":404,"message":"Active cigar not found","errorSources":[{"path":"","message":"Active cigar not found"}],"stack":null}
```

- 400: invalid input, IDs or budget range. Display validation message; fix request values.
- 401: missing/expired/invalid Bearer token. Re-login; no implemented token-refresh route.
- 403: role mismatch or login of suspended user. No admin token in consumer app.
- 404: resource absent/inactive or incorrect ID type. Check master vs inventory before concluding deleted product.
- 409: customer registration email already exists.
- Network timeout/offline/5xx: error with retry; do not overwrite last good list with stock zero.

Profile GET references may be populated while PATCH returns ID string. Journal GET/list populated references versus write responses raw IDs. Unknown optional fields may be omitted, not null. Parsers allow extra fields but reject wrong list/object shape.
