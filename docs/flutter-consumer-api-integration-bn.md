# Flutter consumer API integration — source audit

তারিখ: 2026-10-03। চারটি supplied ZIP এবং বর্তমান backend source দেখে তৈরি। Production deployment/device execution যাচাই করা হয়নি। নিচের existing API মানে source-এ আছে; production-এ একই version আছে ধরে নেওয়া যাবে না। Backend বা Flutter business code এই audit-এ পরিবর্তন করা হয়নি।

## 1. মূল flow এবং ID

Global catalog → master cigar details → available shops নির্বাচন → store-specific stock/location → related inventory.

Website storefront আগে থেকেই `/store/{storeSlug}` context-এ থাকে। ফলে তার cigar cards দোকানের inventory records। App global home-এ একই context নেই। Customer login থেকে retailer ID পাওয়া যাবে না; customer এবং retailer আলাদা account/resource।

| ID/context | উদাহরণ | কোথায় ব্যবহার |
| --- | --- | --- |
| masterCigarId | `6abb8af3ca05a7b9788d0f0e` | consumer catalog details, favorite, rating, journal |
| inventoryId | `6abb8b38ca05a7b9788d0fad` | inventory details, related, exclusive picks |
| retailerId | `6a64312909e1ef36a786a017` | consumer detail/scan/recommendation store context |
| storeSlug | retailer response-এর `storeSlug` | website-style inventory list, staff picks, related |

এক master cigar অনেক inventory record-এ থাকতে পারে; দোকান, humidor, shelf ও price আলাদা হতে পারে। চারটি identifier আলাদা model fields হিসেবে রাখবে। `storeName` display label; slug route-এ `storeSlug` ব্যবহার করবে।

## 2. ZIP audit findings

- Website `src/lib/storeInventory.ts`: `GET /inventory/{slug}/inventory-list`; cards-এর `_id` inventory ID।
- Website `src/lib/inventoryDetails.ts`: `GET /inventory/{inventoryId}`; retailer, humidor ও master populated objects পাওয়া যায়।
- Website `src/lib/relatedCigars.ts`: `GET /inventory/{slug}/{inventoryId}/related`।
- Website `src/lib/guidedDiscovery.ts`: public guided API আগে চেষ্টা করে; failure হলে filtered inventory-list। Fallback `matchScore = 92 - index * 3` frontend-generated, backend personal score নয়।
- Flutter `lib/core/network/constants/api_constants.dart`: base domain `http://10.10.26.124:8002`; `/home`, `/boards`, `/goals`, `/progress` ইত্যাদি অন্য domain-এর endpoint groups আছে। এগুলো Humidor consumer API হিসেবে ব্যবহার করা যাবে না।
- Flutter `home_screen.dart`, `recommended_for_you_screen.dart`, `shop_products_screen.dart`, `partner_shop_demo_data.dart`: hardcoded cigar/shop data।
- Flutter `product_details_data.dart`: demo shelf grid, stock/location defaults; actual IDs নেই। `ProductDetailsData.demo()` দিয়ে details বানানো হচ্ছে।
- Flutter QR screen demo shop খুলছে; photo scan simulated; profile ও change-password UI-তেও demo behavior আছে।
- Flutter `BaseResponse<T>` top-level `meta` ধরে না; pagination model-এ সেটা যোগ করতে হবে।
- Admin master database আলাদা resource; inventory-এর master linkage ছাড়া consumer state এবং website detail ID এক নয়। UI ঠিক দেখানো মানেই app API integration complete নয়।

Backend ZIP এবং workspace-এর catalog/scan service ও recommendation controller একই। Inventory controller আলাদা: ZIP-এ `GET` এবং `POST /inventory/{slug}/guided-discovery` আছে; workspace-এ নেই। Deploy version মিলিয়ে নিতে হবে।

## 3. Base URL/auth/envelope

```text
baseDomain = https://api.humidor411.com
baseUrl    = https://api.humidor411.com/api/v1
Accept: application/json
Content-Type: application/json   # JSON bodies
Authorization: Bearer <customerAccessToken>   # personal APIs
```

Flutter endpoint-এর সঙ্গে `/api/v1` দ্বিগুণ যোগ করবে না। Website `NEXT_PUBLIC_API_URL`-ও একই base URL হবে।

```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "meta": { "page": 1, "limit": 20, "total": 100 },
  "data": []
}
```

প্রতিটি route-এর `data` এক shape নয়: list, nested list এবং object আলাদা parser লাগবে। Null price/availability মানে unknown; zero/out-of-stock বানিয়ে দেখাবে না। Money `(value as num?)?.toDouble()`; quantity numeric; barcode string রাখতে হবে।

## 4. Screen → existing API

সব route নিচে baseUrl-এর relative। `Auth` মানে customer bearer token; `Public` guest access।

| Screen/action | Method/route | Auth | Parsing/context |
| --- | --- | --- | --- |
| Sign up | `POST /auth/customer-register` | Public | `{fullName,email,password}`, token `data.accessToken` |
| Sign in | `POST /auth/login` | Public | `{email,password}` |
| Forgot password | `POST /auth/forgot-password` | Public | `{email}` |
| Reset OTP verify | `POST /auth/verify` | Public | `{email,otp}` |
| Reset password | `POST /auth/reset-password` | Public | `{email,newPassword}`; verify first |
| Change password | `POST /auth/change-password` | Auth | `{oldPassword,newPassword}` |
| Taste questions | `POST /consumer-profile/onboarding` | Auth | arrays/budget body below |
| Taste profile | `GET /consumer-profile/me` | Auth | `data` object or null |
| Edit taste profile | `PATCH /consumer-profile/me` | Auth | same optional preference fields |
| All cigars / Discover | `GET /consumer/cigars?page=1&limit=20` | Public | `data[]`, master `id`, top-level `meta` |
| Global search | `GET /consumer/cigars?search=Romeo` | Public | master IDs |
| My recommendations | `GET /recommendations/me?limit=20` | Auth | `data[]`, `id`/`cigarId` master ID, score/reasons |
| Nearby partner shops | `GET /retailer/nearby?lat=23.8103&lng=90.4125&radius=5000` | Public | `data[]`: retailerId, storeSlug, storeName, address, city, location, distance in meters |
| Shop information | `GET /retailer/slug/{slug}` | Public | retailer object |
| Store QR | `POST /qrcodes/resolve-store` | Public | `{value: scannedStoreUrl}` → retailerId/storeSlug |
| Shop cigars matching website | `GET /inventory/{slug}/inventory-list?page=1&limit=20` | Public | `data[]`, `_id` inventory ID, masterCigarId may be string |
| Shop search | `GET /inventory/{slug}/inventory-list?searchTerm=Romeo` | Public | use `searchTerm`, not catalog's `search` |
| Staff Picks | `GET /inventory/{slug}/staff-picks` | Public | items `data.data[]`, count/groupedByStaff |
| New Arrivals | `GET /inventory/{slug}/new-arrivals` | Public | items `data.data[]`, groupedByRecency |
| Daily Featured | `GET /inventory/{slug}/daily-featured` | Public | items `data.data[]`, count |
| Surprise Me | `GET /inventory/{slug}/surprise-me` | Public | one pick; optional comma-separated `exclude` inventory IDs |
| Website-style single product | `GET /inventory/{inventoryId}` | Public | `data` inventory, populated master/retailer/humidor |
| Global single cigar | `GET /consumer/cigars/{masterId}` | Public | `data.cigar`, storeAvailability=null, userState |
| Selected-store single cigar | `GET /consumer/cigars/{masterId}?retailerId={retailerId}` | Public | `data.storeAvailability.locations[]` |
| Store-mode catalog | `GET /consumer/cigars?retailerId={retailerId}` | Public | in-stock active master cigars, inventory price |
| Store-mode recommendation | `GET /recommendations/me?retailerId={retailerId}` | Auth | store, quantity, location, price, score/reasons |
| Similar / Also Enjoy / More Exclusive | `GET /inventory/{slug}/{inventoryId}/related` | Public | `data.similarCigars[]`, `youMightAlsoEnjoy[]`, `moreExclusive[]` |
| Exclusive only | `GET /inventory/{slug}/{inventoryId}/exclusive-picks` | Public | separate exclusive result; related already includes a section |
| Barcode/manual UPC | `POST /consumer/scans/upc` | Public | `{code,retailerId?}` → `data.cigar`, `data.store` |
| UPC alternative | `GET /consumer/scans/upc/{code}?retailerId=...` | Public | same scan shape |
| My Cigar | `GET /consumer-cigars?type=favorites&page=1&limit=20` | Auth | `type=favorites`, `want-to-try`, `smoked`; no type for all saved states |
| Favorite | `POST /consumer-cigars/{masterId}/favorite` | Auth | remove with DELETE |
| Want to try | `POST /consumer-cigars/{masterId}/want-to-try` | Auth | remove with DELETE |
| Mark smoked | `POST /consumer-cigars/{masterId}/smoked` | Auth | uses master ID |
| Rating | `POST /consumer-cigars/{masterId}/rating` | Auth | `{rating: 5}` integer 1–5 |
| Journal list/create | `GET /journal`, `POST /journal` | Auth | create body below |
| Journal detail/edit/delete | `GET /journal/{id}`, `PATCH /journal/{id}`, `DELETE /journal/{id}` | Auth | ID is journal entry ID |
| Account profile | `GET /user/profile` | Auth | distinct from taste profile |
| Edit name/avatar | `PUT /user/profile` | Auth | multipart; file field `profilePicture`; e.g. fullName |
| Logout | local token/session clearing | — | no `/auth/logout` controller in audited backend |

Catalog filters: `search, brand, strength, wrapper, origin, flavor, size, minPrice, maxPrice, smokingTime, retailerId, page, limit`. Limit default 20, max 100. Recommendations limit default 20, max 100; no catalog-style pagination in recommendation result.

ZIP-only guided route: `GET /inventory/{slug}/guided-discovery?strength=medium&minBudget=10&maxBudget=20&smokingTime=45&limit=6`; optional `wrapper`, `pairingSuggestions`, `profile`. ZIP also has POST form. This ranks store inventory using answers, not saved personal recommendation state. Before integrating into current workspace/deployment, reconcile the ZIP implementation. Do not claim website guided ranking and `/recommendations/me` produce identical order.

## 5. Product detail parsing

### Website inventory route

`GET /inventory/6abb8b38ca05a7b9788d0fad`

| UI | JSON path |
| --- | --- |
| Store ID/name/slug | `data.retailerId._id`, `.storeName`, `.storeSlug` |
| Inventory ID | `data._id` |
| Master ID | `data.masterCigarId._id` |
| Name/image/price/box price/quantity | `data.name`, `.image`, `.price`, `.pricePerBox`, `.quantity` |
| Humidor | `data.humidorName` / `data.humidorId.name` |
| Wall/shelf/row/column | `data.wallName`, `.shelfName`, `.shelfRow`, `.shelfColumn` |
| Master blend information | `data.masterCigarId.binder`, `.filler`, `.country`, `.flavorNotes` |

বর্তমান public inventory details unrestricted findById এবং populated userId/retailerId/humidorId/master data ফেরত দেয়। Consumer-facing safe projection এবং approved retailer/active humidor/status visibility checks backend-এ align করা উচিত। এটাকে new global discovery contract হিসেবে expand করা উচিত নয়।

### Consumer master route with selected store

`GET /consumer/cigars/6abb8af3ca05a7b9788d0f0e?retailerId=6a64312909e1ef36a786a017`

```text
data.cigar.id                         → masterCigarId
data.cigar.*                          → product description/specifications
data.storeAvailability.retailerId     → selected store ID
data.storeAvailability.storeName      → shop label
data.storeAvailability.available      → in-stock boolean
data.storeAvailability.quantity       → total sellable stock across locations
data.storeAvailability.price          → first available location regular price
data.storeAvailability.pricePerBox    → primary location box price
data.storeAvailability.locations[]    → EVERY inventory/location entry
  inventoryId, available, quantity, price, pricePerBox
  location.humidorId, humidor, wallId, wall, shelfId, shelf, column
data.userState                        → favorite, wantToTry, smoked, rating
```

Consumer location বর্তমানে `shelfRow` ফেরত দেয় না; column আছে। Store slug/address/map coordinates-ও এই availability object-এ নেই। Selected shop model থেকে slug/address/coordinates রাখবে। Full shelf grid-এর neighbouring products এই single API থেকে পাওয়া যায় না; demo grid-কে actual grid হিসেবে দেখাবে না। একই store-এর দুই location-এর দাম আলাদা হলে তাদের আলাদা price দেখাবে।

Stock=0 হলে out-of-stock দেখাবে; API failure/unknown stock-কে stock=0 বানাবে না। Saved user rating হলো নিজের rating, public average rating নয়। Global mode-এর suggested price-কে দোকানের actual price label দেবে না। Consumer store API regular inventory price ব্যবহার করে; featured/discount display calculation একইভাবে server-side না হলে website/app promotional prices ভিন্ন হতে পারে।

## 6. Global cigar → সব দোকান: missing contract

বর্তমানে `/consumer/cigars/{masterId}` retailerId ছাড়া সব stockist দেয় না। `/inventory` all-inventory route admin-only; consumer ব্যবহার করবে না।

অস্থায়ী existing flow: nearby/shop নির্বাচন → retailerId/storeSlug save → store detail call। Nearby shops list কোনো নির্দিষ্ট cigar ওই দোকানে আছে এমন নিশ্চয়তা দেয় না। সব retailer-এর জন্য request loop global stockists-এর ভালো স্থায়ী implementation নয়।

প্রয়োজনীয় নতুন API (PROPOSED, existing নয়):

```http
GET /consumer/cigars/{masterId}/stores?page=1&limit=20
```

```json
{
  "success": true,
  "statusCode": 200,
  "meta": { "page": 1, "limit": 20, "total": 1 },
  "data": [{
    "retailerId": "6a64312909e1ef36a786a017",
    "storeSlug": "EXAMPLE_SLUG",
    "storeName": "EXAMPLE_NAME",
    "address": "EXAMPLE_ADDRESS",
    "available": true,
    "quantity": 8,
    "locations": [{
      "inventoryId": "6abb8b38ca05a7b9788d0fad",
      "price": 15.5,
      "pricePerBox": 150,
      "quantity": 8,
      "location": {
        "humidorId": "6abb8b3598de3a28946dc896",
        "humidor": "EXAMPLE_HUMIDOR",
        "wall": "Wall A",
        "shelf": "Top Shelf",
        "row": 1,
        "column": 4
      }
    }]
  }]
}
```

Example shop labels invented; IDs/price/quantity based on supplied inventory, not live verification. Implementation should join active master → approved retailer → active humidor → visible inventory, group by retailer, paginate stores, project only public fields. Decide out-of-stock and effective promotional price policy explicitly. Optional geo ordering can be added with validated lat/lng.

App এরপর clicked masterId দিয়ে stores API call করে shop selection sheet দেখাবে। Selection থেকে retailerId, storeSlug, inventoryId নিয়ে existing detail + related APIs reuse হবে। Global Staff Picks across all retailers এবং global related-by-master API-ও বর্তমানে নেই; existing Staff Picks/Related store-specific।

## 7. Request bodies

```json
{
  "experienceLevel": "experienced",
  "preferredStrengths": ["medium"],
  "preferredWrappers": ["Indonesian"],
  "preferredFlavors": ["Cedar", "Nuts"],
  "preferredOrigins": ["Dominican Republic"],
  "preferredSmokingTimes": ["45"],
  "favoriteBrands": ["Romeo y Julieta"],
  "minBudget": 10,
  "maxBudget": 20
}
```

Send above to POST onboarding / PATCH taste profile. UI question labels map to DTO fields; array values match catalog values. Beverage pairing has no dedicated persisted preference field in this profile DTO; ZIP guided-discovery supports pairing input separately.

```json
{ "code": "712345000002", "retailerId": "6a64312909e1ef36a786a017" }
```

Above: POST UPC. Without retailerId, `data.store=null`; do not invent selected shop.

```json
{ "value": "https://YOUR_CONFIGURED_FRONTEND_DOMAIN/store/ACTUAL_STORE_SLUG" }
```

Above: POST QR resolve. URL origin must equal backend FRONTEND_URL; manual bare slug is not accepted by this route. Manual slug can use GET retailer/slug/{slug}, then choose approved shop.

```json
{
  "cigarId": "6abb8af3ca05a7b9788d0f0e",
  "retailerId": "6a64312909e1ef36a786a017",
  "rating": 5,
  "notes": "Smooth, cedar and nuts",
  "flavorTags": ["cedar", "nuts"],
  "strengthImpression": "medium",
  "pricePaid": 15.5,
  "wouldSmokeAgain": true
}
```

Above: POST journal; optional smokedAt ISO date. Journal CRUD uses journal entry ID, never inventory ID.

## 8. Copyable curl sequence

Examples are shell curl syntax (PowerShell: use curl.exe; replace line continuations appropriately). TOKEN and STORE_SLUG are placeholders, not known production values.

```bash
# Global list
curl 'https://api.humidor411.com/api/v1/consumer/cigars?page=1&limit=20' -H 'Accept: application/json'

# Known cigar, selected shop, exact inventory IDs in locations[]
curl 'https://api.humidor411.com/api/v1/consumer/cigars/6abb8af3ca05a7b9788d0f0e?retailerId=6a64312909e1ef36a786a017' -H 'Accept: application/json'

# Website inventory detail, known inventory ID
curl 'https://api.humidor411.com/api/v1/inventory/6abb8b38ca05a7b9788d0fad' -H 'Accept: application/json'

# Same store inventory search
curl 'https://api.humidor411.com/api/v1/inventory/STORE_SLUG/inventory-list?searchTerm=Romeo&page=1&limit=20'

# Same-store related sections; INVENTORY ID
curl 'https://api.humidor411.com/api/v1/inventory/STORE_SLUG/6abb8b38ca05a7b9788d0fad/related'

# Personalized recommendation; MASTER IDs in response
curl 'https://api.humidor411.com/api/v1/recommendations/me?retailerId=6a64312909e1ef36a786a017&limit=20' -H 'Authorization: Bearer TOKEN'

# Barcode
curl -X POST 'https://api.humidor411.com/api/v1/consumer/scans/upc' -H 'Content-Type: application/json' -d '{"code":"712345000002","retailerId":"6a64312909e1ef36a786a017"}'

# Favorite uses MASTER ID
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/6abb8af3ca05a7b9788d0f0e/favorite' -H 'Authorization: Bearer TOKEN'
```

## 9. Flutter controller/repository plan

These controller names are recommended additions, not claims that they already exist.

| Controller | Calls/state |
| --- | --- |
| AuthController | customer-register/login/password; replace generic auth paths |
| TasteProfileController | profile GET/onboarding/PATCH; completion state |
| StoreContextController | nearby/QR/slug; persist retailerId/storeSlug/name/address/coordinates; explicit exit Store Mode |
| ConsumerHomeController | catalog + personalized recommendations; selected-store staff/new/featured |
| DiscoverController | catalog or storefront search; debounce/cancel stale searches; page/meta |
| CigarDetailsController | masterId/inventoryId routing; userState; stores missing contract; selected location and related |
| MyCigarsController | own favorites/want-to-try/smoked; update state after mutation |
| ScanController | actual barcode → UPC; QR → store context; photo identification separate missing API |
| ProfileController | account profile and taste profile independently |
| JournalController | journal entries and CRUD |

Repository/models should separate CatalogCigar, InventoryItem, StoreAvailability, StockLocation, RelatedCigars and paginated envelope. Do not force nested scan/detail/list JSON into one parser. Normalize masterCigarId string/populated object explicitly; `.id` and `._id` have route-specific meanings. `Image.network` for API images, with loading/error placeholders; keep images from API distinct from bundled demo assets.

Product model must carry masterCigarId, optional inventoryId, retailerId, storeSlug and nullable price/stock. Current string-only price/rating and fixed shelf demo model cannot represent live detail correctly.

## 10. Remaining unsupported/mismatched features

- New all-stockist lookup is required for global product click → every shop/price/stock.
- Consumer location row missing; full shelf grid needs a public shelf layout/occupancy contract. Existing detail highlights location only.
- Global Staff Picks aggregation is missing; current staff picks are per store.
- Camera photo identification backend not found; UPC lookup is available. Flutter simulation must be labelled/replaced.
- Dedicated consumer age-verification workflow not found. A user dateOfBirth field exists, which does not establish completed age verification.
- Public app About/Privacy/Terms content routes not identified; `/settings` is admin-only. Use approved bundled content or add explicit public content routes.
- Flutter auth constants `/verify-otp`, `/verify-email`, `/refresh-token`, `/resend-otp`, `/logout` do not match audited auth controller. Reset verification is `/auth/verify`; password change is POST, not PATCH. Do not assume sign-up OTP behaves like reset OTP without a defined registration contract.
- Website guided ranking and personal recommendations are different algorithms; align them if exact same rankings are required. Fallback scores must not be presented as measured confidence.
- Consumer public average star rating is not provided by personal userState.rating; hide/demo label until contract exists.

## 11. Integration verification checklist

1. Set production base URL and register/login a customer; assert customer role and token storage.
2. Catalog ID → master detail; inventory ID → inventory detail. Wrong ID should surface a useful message, not generic blank page.
3. Use one real approved retailer with active humidor; compare website and app inventory price/quantity/wall/shelf/row/column from same record.
4. Verify multiple locations, different prices, zero stock, inactive humidor, empty store and absent profile.
5. Confirm feature lists parse `data.data`, catalog parses `data[]`, detail parses object, and pagination retains top-level meta.
6. Related call uses storeSlug + inventoryId; clicking related item preserves store context.
7. Test guest/global unknown availability versus logged-in personal state; favorites/journal always use master ID.
8. Verify UPC leading zeros, unknown UPC, invalid QR origin and actual device camera/location permissions.
9. Confirm actual deployed guided route version; compare personalized ranking separately from guided answers.
10. Check promotion-price policy on website and app before claiming prices match.

Source audit complete; no live production endpoint calls, authentication mutations, builds or Flutter device tests were performed for this documentation request.
