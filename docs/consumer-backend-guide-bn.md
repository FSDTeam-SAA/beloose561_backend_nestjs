# Consumer backend: সহজ code guide

এই update-এ roadmap-এর দুইটি প্রধান demo flow করা হয়েছে:

1. UPC → Master Cigar → Selected Store → Stock/Price → Humidor/Wall/Shelf/Column
2. Customer → Taste Profile → Store QR → Available Store Cigars → Recommendation

## কোড কোন order-এ পড়বেন

প্রতিটি module-এ একই নিয়ম: **Controller → DTO validation → Service → Entity/Database**।

| Module | কাজ |
| --- | --- |
| `master-database` | Central cigar information, UPC, admin create/update |
| `consumer-scan` | UPC lookup এবং retailer-এর stock/location |
| `auth` | Customer registration; existing login reuse |
| `qrcodes` | Existing store QR URL থেকে approved retailer বের করা |
| `consumer-profile` | Onboarding-এর taste preferences |
| `consumer-cigar` | Customer-এর favorite/want-to-try/smoked/rating |
| `consumer-activity` | Logged-in customer-এর scan/search/view এবং preference actions |
| `consumer-catalog` | Cigar search/detail; Store Mode-এ in-stock catalog |
| `recommendation` | Taste + behavior দিয়ে score ও ranking |

`consumer-scan.service.ts` থেকে শুরু করুন:

- `scan()` — UPC দিয়ে master খোঁজে, তারপর cigar ও store result ফেরত দেয়।
- `getCigarDetails()` — app-এ কোন master fields দেখানো হবে তা ঠিক করে।
- `getStoreAvailability()` — retailer, inventory ও humidor মিলিয়ে quantity/price/location তৈরি করে।

Detail page এবং recommendation-ও এই একই methods reuse করে। একই cigar অন্য retailer-এ যোগ করার জন্য নতুন master record লাগে না।

## Demo 1: UPC scan

সব route-এর prefix `/api/v1`। Admin bearer token দিয়ে:

```http
POST /api/v1/master-database
Content-Type: application/json
```

```json
{
  "brand": "Padron",
  "productLine": "1964 Anniversary Toro",
  "upcCodes": ["001234567890"],
  "strength": "medium",
  "wrapper": "Natural",
  "country": "Nicaragua",
  "flavorNotes": ["Cocoa", "Coffee"],
  "filler": ["Nicaragua"],
  "pairingSuggestions": ["Coffee"],
  "estimatedSmokingTime": "1 Hour",
  "suggestedRetailPriceEach": 20,
  "status": "active"
}
```

UPC string রাখবেন, number নয়। Array fields-এ JSON array পাঠাবেন; comma-separated string নয়। এটি sample barcode, বাস্তব product barcode নয়।

Update:

```http
PATCH /api/v1/master-database/MASTER_CIGAR_ID
Content-Type: application/json
```

```json
{ "upcCodes": ["001234567890"], "flavorNotes": ["Cocoa", "Cedar"] }
```

Existing `PUT /master-database/master-database/:id` route-ও রাখা আছে। তারপর existing retailer inventory API দিয়ে master ID, humidor, wall, shelf, column, quantity ও price save করুন। Retailer approved এবং humidor active হতে হবে।

```http
GET /api/v1/master-database/upc/001234567890
POST /api/v1/consumer/scans/upc
```

```json
{ "code": "001234567890", "retailerId": "RETAILER_OBJECT_ID" }
```

`retailerId` বাদ দিলে `data.store: null`। Store দিলে `data.store`-এ availability, total sellable quantity, price, box price, location ও `locations[]` পাবেন। একাধিক location-এর price আলাদা থাকতে পারে। Top-level price/location প্রথম in-stock record-এর; সব location দেখাতে `locations` ব্যবহার করবেন। Out-of-stock record-এর sellable quantity zero।

Guest scan করা যায়। Customer bearer token পাঠালে scan activity-ও save হয়।

## Demo 2: Customer → Store recommendation

### 1. Customer account

```http
POST /api/v1/auth/customer-register
```

```json
{ "fullName": "Alex Smith", "email": "alex@example.com", "password": "secret123" }
```

Backend নিজে `role: customer` বসায়। Password existing schema hook দিয়ে hash হয়। Response-এর `data.accessToken` পরের authenticated requests-এ ব্যবহার করবেন। Existing `/auth/register` retailer flow রাখা আছে। পরেরবার `/auth/login` ব্যবহার করবেন। নতুন registration email verification দাবি করে না; বিদ্যমান pending verification status থাকে।

### 2. Taste profile

```http
POST /api/v1/consumer-profile/onboarding
Authorization: Bearer CUSTOMER_ACCESS_TOKEN
```

```json
{
  "experienceLevel": "experienced",
  "preferredStrengths": ["medium"],
  "preferredWrappers": ["Natural"],
  "preferredFlavors": ["Cocoa", "Coffee"],
  "preferredOrigins": ["Nicaragua"],
  "preferredSmokingTimes": ["60"],
  "favoriteBrands": ["Padron"],
  "minBudget": 15,
  "maxBudget": 25
}
```

পড়তে `GET /consumer-profile/me`, পরিবর্তনে `PATCH /consumer-profile/me`। Body-তে userId দিতে হবে না; token থেকে নেওয়া হয়। `minBudget > maxBudget` হলে 400। Profile না থাকলে GET-এ `data: null`। Onboarding endpoint completion flag true করে।

### 3. Store QR

```http
POST /api/v1/qrcodes/resolve-store
```

```json
{ "value": "https://YOUR_FRONTEND_DOMAIN/store/STORE_SLUG" }
```

Existing generated QR-এর URL ব্যবহার করবেন। URL-এর origin backend-এর `FRONTEND_URL`-এর সঙ্গে মিলতে হবে। Response থেকে `retailerId` নিয়ে app locally Store Mode রাখবে। Backend-এ আলাদা store-session collection নেই। URL download/fetch করা হয় না।

### 4. Recommendation

```http
GET /api/v1/recommendations/me?retailerId=RETAILER_OBJECT_ID
Authorization: Bearer CUSTOMER_ACCESS_TOKEN
```

Retailer ID থাকলে শুধু approved store-এর active humidor-এ available inventory candidates। না থাকলে active master catalog। `limit` default 20, maximum 100।

Response `data[]`-এ cigar details, `matchScore`, `matchReasons`, price, quantity, location ও store result পাবেন। `meta.onboardingCompleted` দেখেও app onboarding দরকার কি না বুঝতে পারে। Profile না থাকলে behavior এবং stable catalog order ব্যবহার হবে। Global mode-এ price হলো suggested master price; availability unknown (`null`)।

## Taste কীভাবে evolve করে

`recommendation-score.ts`-এ weights একসাথে আছে:

| Match | Points |
| --- | --- |
| Strength | 25 |
| Wrapper | 15 |
| Flavor | প্রতি flavor 10, সর্বোচ্চ 20 |
| Budget | 20 |
| Favorite brand | 10 |
| Origin | 5 |
| Smoking time | 5 |
| Behavior | সর্বোচ্চ 5 |
| আগে low rating (1–2) | −10 |

Final score 0–100-এ সীমিত। এটি ranking score, enjoyment probability নয়। Store Mode-এ budget match retailer price দিয়ে হয়। Regular inventory price ব্যবহার হয়; promotional price calculation এই flow-তে নেই।

Current favorites, want-to-try, smoked, high ratings এবং latest 100 scan/view/search activities থেকে brand/strength/search interest নেওয়া হয়। Rating 1–2 দেওয়া cigar positive behavior source হয় না এবং তার score কমে। Preferences নিজে overwrite হয় না। Activity events analytics/history; current UserCigar state favorite/rating-এর source of truth।

## অন্য consumer APIs

সব personal cigar-state route-এ customer bearer token লাগবে:

```text
GET    /consumer-cigars?type=favorites&page=1&limit=20
GET    /consumer-cigars?type=want-to-try
GET    /consumer-cigars?type=smoked
POST   /consumer-cigars/:cigarId/favorite
DELETE /consumer-cigars/:cigarId/favorite
POST   /consumer-cigars/:cigarId/want-to-try
DELETE /consumer-cigars/:cigarId/want-to-try
POST   /consumer-cigars/:cigarId/smoked
POST   /consumer-cigars/:cigarId/rating      body: { "rating": 5 }
GET    /consumer/cigars/:cigarId?retailerId=...
GET    /consumer/cigars?search=Padron&retailerId=...
```

Catalog/detail guest-ও দেখতে পারে। Customer token থাকলে detail-এ নিজের state এবং view/search activity থাকে। Discover filters: `search`, `brand`, `strength`, `wrapper`, `origin`, `flavor`, `size`, `minPrice`, `maxPrice`, `smokingTime`, `retailerId`, `page`, `limit`। Store Mode-এর discover-এ শুধু in-stock cigars; detail/scan out-of-stock state-ও দেখাতে পারে।

## Verification ও বাকি কাজ

- Unit/service tests: `npm test -- --runInBand`
- HTTP validation/auth এবং module/Swagger tests: `npm run test:e2e -- --runInBand`
- Compilation: `npm run build`

Tests-এ database/service mocks ব্যবহার করা হয়েছে। Live MongoDB, actual UPC এবং Flutter/device দিয়ে demo এখনো প্রয়োজন। এই update deployment বা production-data পরিবর্তন করে না।

V1 recommendation সব matching master candidates memory-তে score করে; বড় catalog-এর জন্য query/scoring optimization পরে প্রয়োজন হবে। State update ও activity insert আলাদা writes, তাই activity failure-এ state save হয়ে যেতে পারে; analytics-এর জন্য transactional outbox এই version-এ নেই।

Roadmap-এর পরবর্তী কাজ: flexible inventory bulk import, journal, nearby retailer/geo, image recognition POC। এগুলো এই দুই-flow update-এর অংশ নয়।
