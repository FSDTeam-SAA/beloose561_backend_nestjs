# Consumer app: full API reference

Audited source, not live production capture. Examples show relevant fields, extra fields omitted; example records and scores are illustrative.

Base: `https://api.humidor411.com/api/v1`. সব values illustrative; omitted optional fields may be absent rather than null. Store labels, IDs starting 0000, timestamps/score examples are placeholders. User-supplied IDs/price/stock are not a live database guarantee.

Public requests use no token in collection; add valid customer Bearer when personal state/history is needed. Auth=true requires customer Bearer. POST default201 unless controller explicitly200.

## Index

| Key | Method/route | Token | Version | Parser |
|---|---|---|---|---|
| customerRegister | POST `/auth/customer-register` | Public/optional | workspace-and-zip | `data` |
| login | POST `/auth/login` | Public/optional | workspace-and-zip | `data` |
| forgotPassword | POST `/auth/forgot-password` | Public/optional | workspace-and-zip | `data` |
| verifyResetOtp | POST `/auth/verify` | Public/optional | workspace-and-zip | `data` |
| resetPassword | POST `/auth/reset-password` | Public/optional | workspace-and-zip | `data` |
| changePassword | POST `/auth/change-password` | Customer | workspace-and-zip | `data` |
| getTasteProfile | GET `/consumer-profile/me` | Customer | workspace-and-zip | `data` |
| completeOnboarding | POST `/consumer-profile/onboarding` | Customer | workspace-and-zip | `data` |
| updateTasteProfile | PATCH `/consumer-profile/me` | Customer | workspace-and-zip | `data` |
| catalog | GET `/consumer/cigars?page=1&limit=20` | Public/optional | workspace-and-zip | `data[]` |
| catalogSearch | GET `/consumer/cigars?search=Romeo&strength=medium&page=1&limit=20` | Public/optional | workspace-and-zip | `data[]` |
| storeCatalog | GET `/consumer/cigars?retailerId={{retailerId}}&page=1&limit=20` | Public/optional | workspace-and-zip | `data[]` |
| masterDetail | GET `/consumer/cigars/{{masterCigarId}}` | Public/optional | workspace-and-zip | `data` |
| masterStoreDetail | GET `/consumer/cigars/{{masterCigarId}}?retailerId={{retailerId}}` | Public/optional | workspace-and-zip | `data` |
| recommendGlobal | GET `/recommendations/me?limit=20` | Customer | workspace-and-zip | `data[]` |
| recommendStore | GET `/recommendations/me?retailerId={{retailerId}}&limit=20` | Customer | workspace-and-zip | `data[]` |
| nearbyShops | GET `/retailer/nearby?lat={{lat}}&lng={{lng}}&radius=5000&page=1&limit=20` | Public/optional | workspace-and-zip | `data[]` |
| shopBySlug | GET `/retailer/slug/{{storeSlug}}` | Public/optional | workspace-and-zip | `data` |
| shopById | GET `/retailer/{{retailerId}}` | Public/optional | workspace-and-zip | `data` |
| storeInventory | GET `/inventory/{{storeSlug}}/inventory-list?page=1&limit=20` | Public/optional | workspace-and-zip | `data[]` |
| storeInventorySearch | GET `/inventory/{{storeSlug}}/inventory-list?searchTerm=Romeo&minPrice=10&maxPrice=20&page=1&limit=20` | Public/optional | workspace-and-zip | `data[]` |
| staffPicks | GET `/inventory/{{storeSlug}}/staff-picks` | Public/optional | workspace-and-zip | `data.data[]` |
| newArrivals | GET `/inventory/{{storeSlug}}/new-arrivals` | Public/optional | workspace-and-zip | `data.data[]` |
| dailyFeatured | GET `/inventory/{{storeSlug}}/daily-featured` | Public/optional | workspace-and-zip | `data.data[]` |
| inventoryDetail | GET `/inventory/{{inventoryId}}` | Public/optional | workspace-and-zip | `data` |
| related | GET `/inventory/{{storeSlug}}/{{inventoryId}}/related` | Public/optional | workspace-and-zip | `data` |
| exclusive | GET `/inventory/{{storeSlug}}/{{inventoryId}}/exclusive-picks` | Public/optional | workspace-and-zip | `data[]` |
| surprise | GET `/inventory/{{storeSlug}}/surprise-me?exclude={{excludeInventoryIds}}` | Public/optional | workspace-and-zip | `data` |
| resolveStoreQr | POST `/qrcodes/resolve-store` | Public/optional | workspace-and-zip | `data` |
| scanUpc | POST `/consumer/scans/upc` | Public/optional | workspace-and-zip | `data` |
| lookupUpc | GET `/consumer/scans/upc/{{upc}}?retailerId={{retailerId}}` | Public/optional | workspace-and-zip | `data` |
| myCigars | GET `/consumer-cigars?type=favorites&page=1&limit=20` | Customer | workspace-and-zip | `data[]` |
| myWantToTry | GET `/consumer-cigars?type=want-to-try&page=1&limit=20` | Customer | workspace-and-zip | `data[]` |
| mySmoked | GET `/consumer-cigars?type=smoked&page=1&limit=20` | Customer | workspace-and-zip | `data[]` |
| myAllCigars | GET `/consumer-cigars?page=1&limit=20` | Customer | workspace-and-zip | `data[]` |
| favorite | POST `/consumer-cigars/{{masterCigarId}}/favorite` | Customer | workspace-and-zip | `data` |
| unfavorite | DELETE `/consumer-cigars/{{masterCigarId}}/favorite` | Customer | workspace-and-zip | `data` |
| wantToTry | POST `/consumer-cigars/{{masterCigarId}}/want-to-try` | Customer | workspace-and-zip | `data` |
| removeWantToTry | DELETE `/consumer-cigars/{{masterCigarId}}/want-to-try` | Customer | workspace-and-zip | `data` |
| markSmoked | POST `/consumer-cigars/{{masterCigarId}}/smoked` | Customer | workspace-and-zip | `data` |
| rateCigar | POST `/consumer-cigars/{{masterCigarId}}/rating` | Customer | workspace-and-zip | `data` |
| createJournal | POST `/journal` | Customer | workspace-and-zip | `data` |
| journalList | GET `/journal?page=1&limit=20` | Customer | workspace-and-zip | `data[]` |
| journalDetail | GET `/journal/{{journalId}}` | Customer | workspace-and-zip | `data` |
| updateJournal | PATCH `/journal/{{journalId}}` | Customer | workspace-and-zip | `data` |
| deleteJournal | DELETE `/journal/{{journalId}}` | Customer | workspace-and-zip | `data` |
| accountProfile | GET `/user/profile` | Customer | workspace-and-zip | `data` |
| updateAccountProfile | PUT `/user/profile` | Customer | workspace-and-zip | `data` |
| guidedStoreGet | GET `/inventory/{{storeSlug}}/guided-discovery?strength=medium&minBudget=10&maxBudget=20&smokingTime=60&wrapper=Indonesian&pairingSuggestions=Coffee&profile=familiar&limit=6` | Public/optional | zip-only | `data[]` |
| guidedStorePost | POST `/inventory/{{storeSlug}}/guided-discovery` | Public/optional | zip-only | `data[]` |

## customerRegister

**POST /auth/customer-register**

Screen group: 01 Auth. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 201.

Required: fullName non-empty, email valid, password min 6. Customer role set by backend. Duplicate email 409. Registration does NOT send signup OTP.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "fullName": "{{fullName}}",
  "email": "{{email}}",
  "password": "{{password}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "accessToken": "EXAMPLE_JWT_NOT_VALID",
    "newUser": {
      "id": "000000000000000000000001",
      "fullName": "Demo Customer",
      "email": "demo@example.com",
      "role": "customer"
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/customer-register' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"fullName":"{{fullName}}","email":"{{email}}","password":"{{password}}"}'
```

## login

**POST /auth/login**

Screen group: 01 Auth. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Required email/password (min 6). Login user uses _id, registration newUser uses id. Cookie refreshToken set, but no refresh route found. Suspended 403, wrong password 401, missing user 404.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "EXAMPLE_JWT_NOT_VALID",
    "user": {
      "_id": "000000000000000000000001",
      "fullName": "Demo Customer",
      "email": "demo@example.com",
      "role": "customer",
      "status": "active",
      "verfied": "pending"
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/login' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}","password":"{{password}}"}'
```

## forgotPassword

**POST /auth/forgot-password**

Screen group: 01 Auth. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Sends password-reset email; this request has an external effect. OTP validity is 1 hour in current service. No dedicated resend route; do not automatically resend.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "email": "{{email}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "message": "Check your email for OTP"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/forgot-password' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}"}'
```

## verifyResetOtp

**POST /auth/verify**

Screen group: 01 Auth. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

RESET OTP only. Sets verifiedForget=true and clears OTP; do not interpret as completed signup/email verification.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "email": "{{email}}",
  "otp": "{{otp}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "message": "OTP verified successfully"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/verify' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}","otp":"{{otp}}"}'
```

## resetPassword

**POST /auth/reset-password**

Screen group: 01 Auth. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Email + newPassword min 6. Requires prior reset OTP verification.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "email": "{{email}}",
  "newPassword": "{{newPassword}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password reset successfully"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/reset-password' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}","newPassword":"{{newPassword}}"}'
```

## changePassword

**POST /auth/change-password**

Screen group: 01 Auth. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Both passwords min 6; same new/old password rejected. POST, not PATCH.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "oldPassword": "{{password}}",
  "newPassword": "{{newPassword}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password changed successfully"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/change-password' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"oldPassword":"{{password}}","newPassword":"{{newPassword}}"}'
```

## getTasteProfile

**GET /consumer-profile/me**

Screen group: 02 Taste profile. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

No profile → data:null. GET populates userId object; write responses can contain userId string. Ignore extra database fields.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Taste profile retrieved successfully",
  "data": {
    "_id": "000000000000000000000003",
    "userId": {
      "_id": "000000000000000000000001",
      "fullName": "Demo Customer",
      "email": "demo@example.com",
      "role": "customer",
      "status": "active",
      "verfied": "pending"
    },
    "experienceLevel": "experienced",
    "preferredStrengths": [
      "medium"
    ],
    "preferredWrappers": [
      "Indonesian"
    ],
    "preferredFlavors": [
      "Cedar",
      "Nuts"
    ],
    "preferredOrigins": [
      "Dominican Republic"
    ],
    "preferredSmokingTimes": [
      "45"
    ],
    "favoriteBrands": [
      "Romeo y Julieta"
    ],
    "minBudget": 10,
    "maxBudget": 20,
    "onboardingCompleted": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-profile/me' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## completeOnboarding

**POST /consumer-profile/onboarding**

Screen group: 02 Taste profile. Token: customer required. Source version: workspace-and-zip. HTTP success: 201.

Fields optional; experienceLevel beginner|experienced; preference arrays max 50 non-empty strings; numeric budgets >=0 and min<=max. Explicitly marks completed. UI Q1–Q4 must map labels to real fields; beverage pairing is not a persisted profile field.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "experienceLevel": "experienced",
  "preferredStrengths": [
    "medium"
  ],
  "preferredWrappers": [
    "Indonesian"
  ],
  "preferredFlavors": [
    "Cedar",
    "Nuts"
  ],
  "preferredOrigins": [
    "Dominican Republic"
  ],
  "preferredSmokingTimes": [
    "45"
  ],
  "favoriteBrands": [
    "Romeo y Julieta"
  ],
  "minBudget": 10,
  "maxBudget": 20
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "_id": "000000000000000000000003",
    "userId": "000000000000000000000001",
    "experienceLevel": "experienced",
    "preferredStrengths": [
      "medium"
    ],
    "preferredWrappers": [
      "Indonesian"
    ],
    "preferredFlavors": [
      "Cedar",
      "Nuts"
    ],
    "preferredOrigins": [
      "Dominican Republic"
    ],
    "preferredSmokingTimes": [
      "45"
    ],
    "favoriteBrands": [
      "Romeo y Julieta"
    ],
    "minBudget": 10,
    "maxBudget": 20,
    "onboardingCompleted": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-profile/onboarding' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"experienceLevel":"experienced","preferredStrengths":["medium"],"preferredWrappers":["Indonesian"],"preferredFlavors":["Cedar","Nuts"],"preferredOrigins":["Dominican Republic"],"preferredSmokingTimes":["45"],"favoriteBrands":["Romeo y Julieta"],"minBudget":10,"maxBudget":20}'
```

## updateTasteProfile

**PATCH /consumer-profile/me**

Screen group: 02 Taste profile. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Same optional fields as onboarding. Preserve unspecified fields; does not reset completion.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "preferredStrengths": [
    "medium"
  ],
  "minBudget": 10,
  "maxBudget": 20
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Taste profile updated successfully",
  "data": {
    "_id": "000000000000000000000003",
    "userId": "000000000000000000000001",
    "experienceLevel": "experienced",
    "preferredStrengths": [
      "medium"
    ],
    "preferredWrappers": [
      "Indonesian"
    ],
    "preferredFlavors": [
      "Cedar",
      "Nuts"
    ],
    "preferredOrigins": [
      "Dominican Republic"
    ],
    "preferredSmokingTimes": [
      "45"
    ],
    "favoriteBrands": [
      "Romeo y Julieta"
    ],
    "minBudget": 10,
    "maxBudget": 20,
    "onboardingCompleted": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X PATCH 'https://api.humidor411.com/api/v1/consumer-profile/me' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"preferredStrengths":["medium"],"minBudget":10,"maxBudget":20}'
```

## catalog

**GET /consumer/cigars?page=1&limit=20**

Screen group: 03 Catalog. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Optional valid customer bearer adds search activity. Only active masters. Price suggested, store availability unknown. page default1; limit default20/max100.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170,
      "price": 8.5,
      "available": null
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars?page=1&limit=20' -H 'Accept: application/json'
```

## catalogSearch

**GET /consumer/cigars?search=Romeo&strength=medium&page=1&limit=20**

Screen group: 03 Catalog. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Filters: search,brand,strength,wrapper,origin,flavor,size,minPrice,maxPrice,smokingTime,retailerId,page,limit. Query field search, not searchTerm.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170,
      "price": 8.5,
      "available": null
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars?search=Romeo&strength=medium&page=1&limit=20' -H 'Accept: application/json'
```

## storeCatalog

**GET /consumer/cigars?retailerId={{retailerId}}&page=1&limit=20**

Screen group: 03 Catalog. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Approved retailer + active humidor + active positive stock + active master. Response still master id; no retailerId in each catalog item. Keep store context yourself.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170,
      "price": 15.5,
      "available": true
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars?retailerId={{retailerId}}&page=1&limit=20' -H 'Accept: application/json'
```

## masterDetail

**GET /consumer/cigars/{{masterCigarId}}**

Screen group: 03 Catalog. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Optional customer bearer for own state/view history. No stockist list without retailerId. Invalid ID400; missing/inactive master404.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigar details retrieved successfully",
  "data": {
    "cigar": {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170
    },
    "storeAvailability": null,
    "userState": {
      "favorite": false,
      "wantToTry": false,
      "smoked": false,
      "rating": null
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars/{{masterCigarId}}' -H 'Accept: application/json'
```

## masterStoreDetail

**GET /consumer/cigars/{{masterCigarId}}?retailerId={{retailerId}}**

Screen group: 03 Catalog. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Use locations[] for all stock positions and per-location prices. quantity totals sellable inventory; primary price is first in-stock location. No shelfRow, storeSlug or geo in current location projection.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigar details retrieved successfully",
  "data": {
    "cigar": {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170
    },
    "storeAvailability": {
      "retailerId": "6a64312909e1ef36a786a017",
      "storeName": "Demo Shop",
      "available": true,
      "quantity": 8,
      "price": 15.5,
      "pricePerBox": 150,
      "location": {
        "humidorId": "6abb8b3598de3a28946dc896",
        "humidor": "Demo Humidor",
        "wallId": "6abb8b3598de3a28946dc88a",
        "wall": "Wall A",
        "shelfId": "6abb8b3598de3a28946dc88b",
        "shelf": "Top Shelf",
        "column": 4
      },
      "locations": [
        {
          "inventoryId": "6abb8b38ca05a7b9788d0fad",
          "available": true,
          "quantity": 8,
          "price": 15.5,
          "pricePerBox": 150,
          "location": {
            "humidorId": "6abb8b3598de3a28946dc896",
            "humidor": "Demo Humidor",
            "wallId": "6abb8b3598de3a28946dc88a",
            "wall": "Wall A",
            "shelfId": "6abb8b3598de3a28946dc88b",
            "shelf": "Top Shelf",
            "column": 4
          }
        }
      ]
    },
    "userState": {
      "favorite": false,
      "wantToTry": false,
      "smoked": false,
      "rating": null
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars/{{masterCigarId}}?retailerId={{retailerId}}' -H 'Accept: application/json'
```

## recommendGlobal

**GET /recommendations/me?limit=20**

Screen group: 04 Personal recommendations. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Personal taste + behavior + journal. Score0–100 ranking, not measured enjoyment probability. Limit default20/max100; no page parameter.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Recommendations retrieved successfully",
  "meta": {
    "onboardingCompleted": true
  },
  "data": [
    {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170,
      "cigarId": "6abb8af3ca05a7b9788d0f0e",
      "matchScore": 70,
      "matchReasons": [
        "Illustrative reason; actual reasons vary"
      ],
      "available": null,
      "price": 8.5,
      "quantity": null,
      "location": null,
      "store": null
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/recommendations/me?limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## recommendStore

**GET /recommendations/me?retailerId={{retailerId}}&limit=20**

Screen group: 04 Personal recommendations. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Keep master id and store.locations[].inventoryId separately. Personal ranking differs from website guided search.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Recommendations retrieved successfully",
  "meta": {
    "onboardingCompleted": true
  },
  "data": [
    {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170,
      "cigarId": "6abb8af3ca05a7b9788d0f0e",
      "matchScore": 70,
      "matchReasons": [
        "Illustrative reason; actual reasons vary"
      ],
      "available": true,
      "price": 15.5,
      "quantity": 8,
      "location": {
        "humidorId": "6abb8b3598de3a28946dc896",
        "humidor": "Demo Humidor",
        "wallId": "6abb8b3598de3a28946dc88a",
        "wall": "Wall A",
        "shelfId": "6abb8b3598de3a28946dc88b",
        "shelf": "Top Shelf",
        "column": 4
      },
      "store": {
        "retailerId": "6a64312909e1ef36a786a017",
        "storeName": "Demo Shop",
        "available": true,
        "quantity": 8,
        "price": 15.5,
        "pricePerBox": 150,
        "location": {
          "humidorId": "6abb8b3598de3a28946dc896",
          "humidor": "Demo Humidor",
          "wallId": "6abb8b3598de3a28946dc88a",
          "wall": "Wall A",
          "shelfId": "6abb8b3598de3a28946dc88b",
          "shelf": "Top Shelf",
          "column": 4
        },
        "locations": [
          {
            "inventoryId": "6abb8b38ca05a7b9788d0fad",
            "available": true,
            "quantity": 8,
            "price": 15.5,
            "pricePerBox": 150,
            "location": {
              "humidorId": "6abb8b3598de3a28946dc896",
              "humidor": "Demo Humidor",
              "wallId": "6abb8b3598de3a28946dc88a",
              "wall": "Wall A",
              "shelfId": "6abb8b3598de3a28946dc88b",
              "shelf": "Top Shelf",
              "column": 4
            }
          }
        ]
      }
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/recommendations/me?retailerId={{retailerId}}&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## nearbyShops

**GET /retailer/nearby?lat={{lat}}&lng={{lng}}&radius=5000&page=1&limit=20**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Required lat[-90,90],lng[-180,180]. radius meters1–100000 default5000; limit max100. coordinates [longitude,latitude]. Distance meters. Only approved shops with geo data; does not imply clicked cigar is stocked.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Nearby retailers retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "retailerId": "6a64312909e1ef36a786a017",
      "storeName": "Demo Shop",
      "storeSlug": "demo-shop",
      "logo": "https://example.com/logo.png",
      "address": "Example address",
      "city": "Example city",
      "location": {
        "type": "Point",
        "coordinates": [
          90.4125,
          23.8103
        ]
      },
      "distance": 500
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/retailer/nearby?lat={{lat}}&lng={{lng}}&radius=5000&page=1&limit=20' -H 'Accept: application/json'
```

## shopBySlug

**GET /retailer/slug/{{storeSlug}}**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Returns retailer object (additional DB/populated fields possible); use _id as retailerId. This lookup alone does not filter approved status.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Retailer retrieved successfully",
  "data": {
    "_id": "6a64312909e1ef36a786a017",
    "storeName": "Demo Shop",
    "storeSlug": "demo-shop",
    "status": "approved",
    "address": "Example address",
    "city": "Example city",
    "logo": "https://example.com/logo.png",
    "location": {
      "type": "Point",
      "coordinates": [
        90.4125,
        23.8103
      ]
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/retailer/slug/{{storeSlug}}' -H 'Accept: application/json'
```

## shopById

**GET /retailer/{{retailerId}}**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Store info lookup; use profile fields for shop view. Full source response may include additional DB fields.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Retailer retrieved successfully",
  "data": {
    "_id": "6a64312909e1ef36a786a017",
    "storeName": "Demo Shop",
    "storeSlug": "demo-shop",
    "status": "approved",
    "address": "Example address",
    "city": "Example city",
    "logo": "https://example.com/logo.png",
    "location": {
      "type": "Point",
      "coordinates": [
        90.4125,
        23.8103
      ]
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/retailer/{{retailerId}}' -H 'Accept: application/json'
```

## storeInventory

**GET /inventory/{{storeSlug}}/inventory-list?page=1&limit=20**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Website uses this. _id inventory ID; masterCigarId is usually string here (not populated). Active quantity>0. Default pagination limit10 if omitted; set20 explicitly.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Inventory retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "6abb8b38ca05a7b9788d0fad",
      "masterCigarId": "6abb8af3ca05a7b9788d0f0e",
      "retailerId": "6a64312909e1ef36a786a017",
      "humidorId": "6abb8b3598de3a28946dc896",
      "name": "Romeo y Julieta 1875 Bully",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "strength": "medium",
      "wrapper": "Indonesian",
      "size": "5 x 50",
      "smokingTime": "30",
      "description": "A well-balanced, aromatic smoke.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "price": 15.5,
      "pricePerBox": 150,
      "quantity": 8,
      "status": "active",
      "wallId": "6abb8b3598de3a28946dc88a",
      "shelfId": "6abb8b3598de3a28946dc88b",
      "wallName": "Wall A",
      "shelfName": "Top Shelf",
      "shelfRow": 1,
      "shelfColumn": 4,
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "isStaffPick": false,
      "isNewArrival": false,
      "isDailyFeatured": false,
      "isOnDiscount": false
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/inventory-list?page=1&limit=20' -H 'Accept: application/json'
```

## storeInventorySearch

**GET /inventory/{{storeSlug}}/inventory-list?searchTerm=Romeo&minPrice=10&maxPrice=20&page=1&limit=20**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Filters searchTerm,name,brand,productLine,manufacturer,country,wrapper,binder,filler,strength,size,length,flavorNotes,smokingTime,description,whyYoullLikeThis,pairingSuggestions,minPrice,maxPrice; sortBy/sortOrder. Uses searchTerm, not search.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Inventory retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "6abb8b38ca05a7b9788d0fad",
      "masterCigarId": "6abb8af3ca05a7b9788d0f0e",
      "retailerId": "6a64312909e1ef36a786a017",
      "humidorId": "6abb8b3598de3a28946dc896",
      "name": "Romeo y Julieta 1875 Bully",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "strength": "medium",
      "wrapper": "Indonesian",
      "size": "5 x 50",
      "smokingTime": "30",
      "description": "A well-balanced, aromatic smoke.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "price": 15.5,
      "pricePerBox": 150,
      "quantity": 8,
      "status": "active",
      "wallId": "6abb8b3598de3a28946dc88a",
      "shelfId": "6abb8b3598de3a28946dc88b",
      "wallName": "Wall A",
      "shelfName": "Top Shelf",
      "shelfRow": 1,
      "shelfColumn": 4,
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "isStaffPick": false,
      "isNewArrival": false,
      "isDailyFeatured": false,
      "isOnDiscount": false
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/inventory-list?searchTerm=Romeo&minPrice=10&maxPrice=20&page=1&limit=20' -H 'Accept: application/json'
```

## staffPicks

**GET /inventory/{{storeSlug}}/staff-picks**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Example enabled staff pick is hypothetical; supplied inventory isStaffPick=false. Actual source projects feature/public fields, may omit masterCigarId; inventory detail resolves master ID.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Staff picks retrieved successfully",
  "data": {
    "count": 1,
    "data": [
      {
        "_id": "6abb8b38ca05a7b9788d0fad",
        "name": "Romeo y Julieta 1875 Bully",
        "brand": "Romeo y Julieta",
        "strength": "medium",
        "size": "5 x 50",
        "smokingTime": "30",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "price": 15.5,
        "quantity": 8,
        "pairingSuggestions": [
          "Bourbon",
          "Coffee"
        ],
        "wallName": "Wall A",
        "shelfName": "Top Shelf",
        "shelfRow": 1,
        "shelfColumn": 4,
        "humidorName": "Demo Humidor",
        "description": "A well-balanced, aromatic smoke.",
        "staffPickBy": "Demo Staff",
        "staffPickNote": "Illustrative staff note",
        "staffPickAddedAt": "2026-10-03T00:00:00.000Z"
      }
    ],
    "groupedByStaff": {
      "Demo Staff": [
        {
          "_id": "6abb8b38ca05a7b9788d0fad",
          "name": "Romeo y Julieta 1875 Bully",
          "brand": "Romeo y Julieta",
          "strength": "medium",
          "size": "5 x 50",
          "smokingTime": "30",
          "image": "https://picsum.photos/seed/cigar-2/800/600",
          "price": 15.5,
          "quantity": 8,
          "pairingSuggestions": [
            "Bourbon",
            "Coffee"
          ],
          "wallName": "Wall A",
          "shelfName": "Top Shelf",
          "shelfRow": 1,
          "shelfColumn": 4,
          "humidorName": "Demo Humidor",
          "description": "A well-balanced, aromatic smoke.",
          "staffPickBy": "Demo Staff",
          "staffPickNote": "Illustrative staff note",
          "staffPickAddedAt": "2026-10-03T00:00:00.000Z"
        }
      ]
    }
  }
}
```

Parse: `data.data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/staff-picks' -H 'Accept: application/json'
```

## newArrivals

**GET /inventory/{{storeSlug}}/new-arrivals**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Illustrative enabled arrival, not live inventory state. Optional fields/expiry depend record.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "New arrivals retrieved successfully",
  "data": {
    "count": 1,
    "data": [
      {
        "_id": "6abb8b38ca05a7b9788d0fad",
        "name": "Romeo y Julieta 1875 Bully",
        "brand": "Romeo y Julieta",
        "strength": "medium",
        "size": "5 x 50",
        "smokingTime": "30",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "price": 15.5,
        "quantity": 8,
        "pairingSuggestions": [
          "Bourbon",
          "Coffee"
        ],
        "wallName": "Wall A",
        "shelfName": "Top Shelf",
        "shelfRow": 1,
        "shelfColumn": 4,
        "humidorName": "Demo Humidor",
        "newArrivalNote": "Illustrative arrival note",
        "arrivalDate": "2026-10-03T00:00:00.000Z",
        "daysShowing": 0,
        "autoRemoveDays": 30,
        "newArrivalExpiresAt": "2026-11-02T00:00:00.000Z"
      }
    ],
    "groupedByRecency": {
      "today": [
        {
          "_id": "6abb8b38ca05a7b9788d0fad",
          "name": "Romeo y Julieta 1875 Bully",
          "brand": "Romeo y Julieta",
          "strength": "medium",
          "size": "5 x 50",
          "smokingTime": "30",
          "image": "https://picsum.photos/seed/cigar-2/800/600",
          "price": 15.5,
          "quantity": 8,
          "pairingSuggestions": [
            "Bourbon",
            "Coffee"
          ],
          "wallName": "Wall A",
          "shelfName": "Top Shelf",
          "shelfRow": 1,
          "shelfColumn": 4,
          "humidorName": "Demo Humidor",
          "newArrivalNote": "Illustrative arrival note",
          "arrivalDate": "2026-10-03T00:00:00.000Z",
          "daysShowing": 0,
          "autoRemoveDays": 30,
          "newArrivalExpiresAt": "2026-11-02T00:00:00.000Z"
        }
      ],
      "thisWeek": [],
      "thisMonth": []
    }
  }
}
```

Parse: `data.data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/new-arrivals' -H 'Accept: application/json'
```

## dailyFeatured

**GET /inventory/{{storeSlug}}/daily-featured**

Screen group: 05 Shops and storefront. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Illustrative feature, not live state. Time/date policy is server-side; current regular consumer store price does not automatically equal featuredPrice.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Daily featured retrieved successfully",
  "data": {
    "count": 1,
    "data": [
      {
        "_id": "6abb8b38ca05a7b9788d0fad",
        "name": "Romeo y Julieta 1875 Bully",
        "brand": "Romeo y Julieta",
        "strength": "medium",
        "size": "5 x 50",
        "smokingTime": "30",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "price": 15.5,
        "quantity": 8,
        "pairingSuggestions": [
          "Bourbon",
          "Coffee"
        ],
        "wallName": "Wall A",
        "shelfName": "Top Shelf",
        "shelfRow": 1,
        "shelfColumn": 4,
        "humidorName": "Demo Humidor",
        "wrapper": "Indonesian",
        "description": "A well-balanced, aromatic smoke.",
        "featuredNote": "Illustrative feature note",
        "featuredDate": "2026-10-03T00:00:00.000Z",
        "featuredPrice": 14,
        "saving": 1.5
      }
    ]
  }
}
```

Parse: `data.data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/daily-featured' -H 'Accept: application/json'
```

## inventoryDetail

**GET /inventory/{{inventoryId}}**

Screen group: 06 Details and similar. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Website detail API. Includes populated objects and extra DB fields. Use shelfRow/shelfColumn. Public findById currently needs safe projection/visibility alignment before treating it as global consumer contract.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Inventory retrieved successfully",
  "data": {
    "_id": "6abb8b38ca05a7b9788d0fad",
    "masterCigarId": {
      "_id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170
    },
    "retailerId": {
      "_id": "6a64312909e1ef36a786a017",
      "storeName": "Demo Shop",
      "storeSlug": "demo-shop",
      "status": "approved",
      "address": "Example address",
      "city": "Example city",
      "logo": "https://example.com/logo.png",
      "location": {
        "type": "Point",
        "coordinates": [
          90.4125,
          23.8103
        ]
      }
    },
    "humidorId": {
      "_id": "6abb8b3598de3a28946dc896",
      "name": "Demo Humidor"
    },
    "name": "Romeo y Julieta 1875 Bully",
    "brand": "Romeo y Julieta",
    "productLine": "1875",
    "strength": "medium",
    "wrapper": "Indonesian",
    "size": "5 x 50",
    "smokingTime": "30",
    "description": "A well-balanced, aromatic smoke.",
    "image": "https://picsum.photos/seed/cigar-2/800/600",
    "price": 15.5,
    "pricePerBox": 150,
    "quantity": 8,
    "status": "active",
    "wallId": "6abb8b3598de3a28946dc88a",
    "shelfId": "6abb8b3598de3a28946dc88b",
    "wallName": "Wall A",
    "shelfName": "Top Shelf",
    "shelfRow": 1,
    "shelfColumn": 4,
    "pairingSuggestions": [
      "Bourbon",
      "Coffee"
    ],
    "isStaffPick": false,
    "isNewArrival": false,
    "isDailyFeatured": false,
    "isOnDiscount": false,
    "humidorName": "Demo Humidor"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{inventoryId}}' -H 'Accept: application/json'
```

## related

**GET /inventory/{{storeSlug}}/{{inventoryId}}/related**

Screen group: 06 Details and similar. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Same store, exclude current, active stock. Enjoy same brand OR wrapper max4; exclusive higher price max3; similar same strength AND wrapper max4. Each related _id inventory ID.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Related cigars retrieved successfully",
  "data": {
    "youMightAlsoEnjoy": [
      {
        "_id": "000000000000000000000005",
        "name": "Example similar cigar",
        "brand": "Romeo y Julieta",
        "strength": "medium",
        "wrapper": "Indonesian",
        "size": "5 x 50",
        "smokingTime": "45",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "price": 16,
        "quantity": 5,
        "status": "active",
        "pairingSuggestions": [
          "Coffee"
        ]
      }
    ],
    "moreExclusive": [
      {
        "_id": "000000000000000000000005",
        "name": "Example similar cigar",
        "brand": "Romeo y Julieta",
        "strength": "medium",
        "wrapper": "Indonesian",
        "size": "5 x 50",
        "smokingTime": "45",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "price": 16,
        "quantity": 5,
        "status": "active",
        "pairingSuggestions": [
          "Coffee"
        ]
      }
    ],
    "similarCigars": [
      {
        "_id": "000000000000000000000005",
        "name": "Example similar cigar",
        "brand": "Romeo y Julieta",
        "strength": "medium",
        "wrapper": "Indonesian",
        "size": "5 x 50",
        "smokingTime": "45",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "price": 16,
        "quantity": 5,
        "status": "active",
        "pairingSuggestions": [
          "Coffee"
        ]
      }
    ]
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/{{inventoryId}}/related' -H 'Accept: application/json'
```

## exclusive

**GET /inventory/{{storeSlug}}/{{inventoryId}}/exclusive-picks**

Screen group: 06 Details and similar. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Higher regular price, max3. Already available in related.moreExclusive; avoid duplicate fetch unless section loaded independently.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "More exclusive cigars retrieved successfully",
  "data": [
    {
      "_id": "000000000000000000000005",
      "name": "Example similar cigar",
      "brand": "Romeo y Julieta",
      "strength": "medium",
      "wrapper": "Indonesian",
      "size": "5 x 50",
      "smokingTime": "45",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "price": 16,
      "quantity": 5,
      "status": "active",
      "pairingSuggestions": [
        "Coffee"
      ]
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/{{inventoryId}}/exclusive-picks' -H 'Accept: application/json'
```

## surprise

**GET /inventory/{{storeSlug}}/surprise-me?exclude={{excludeInventoryIds}}**

Screen group: 06 Details and similar. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Optional comma-separated exclude IDs. Parse data.item and limitReached; item null when limit reached/no result depending branch. Source has max attempts policy; do not assume perpetual picks.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Surprise pick retrieved successfully",
  "data": {
    "limitReached": false,
    "triesUsed": 1,
    "triesRemaining": 4,
    "maxTries": 5,
    "item": {
      "_id": "6abb8b38ca05a7b9788d0fad",
      "masterCigarId": "6abb8af3ca05a7b9788d0f0e",
      "retailerId": "6a64312909e1ef36a786a017",
      "humidorId": "6abb8b3598de3a28946dc896",
      "name": "Romeo y Julieta 1875 Bully",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "strength": "medium",
      "wrapper": "Indonesian",
      "size": "5 x 50",
      "smokingTime": "30",
      "description": "A well-balanced, aromatic smoke.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "price": 15.5,
      "pricePerBox": 150,
      "quantity": 8,
      "status": "active",
      "wallId": "6abb8b3598de3a28946dc88a",
      "shelfId": "6abb8b3598de3a28946dc88b",
      "wallName": "Wall A",
      "shelfName": "Top Shelf",
      "shelfRow": 1,
      "shelfColumn": 4,
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "isStaffPick": false,
      "isNewArrival": false,
      "isDailyFeatured": false,
      "isOnDiscount": false,
      "location": {
        "humidorName": "Demo Humidor",
        "wallName": "Wall A",
        "shelfName": "Top Shelf",
        "shelfRow": 1,
        "shelfColumn": 4
      },
      "whyThisCigar": "Illustrative explanation"
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/surprise-me?exclude={{excludeInventoryIds}}' -H 'Accept: application/json'
```

## resolveStoreQr

**POST /qrcodes/resolve-store**

Screen group: 07 Scan. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

value required valid store URL from configured FRONTEND_URL origin, path /store/{slug}; approved retailer. No server store session; save context in app.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "value": "{{storeQrUrl}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Store identified successfully",
  "data": {
    "retailerId": "6a64312909e1ef36a786a017",
    "storeName": "Demo Shop",
    "storeSlug": "demo-shop",
    "logo": "https://example.com/logo.png",
    "address": "Example address",
    "city": "Example city",
    "storeMode": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/qrcodes/resolve-store' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"value":"{{storeQrUrl}}"}'
```

## scanUpc

**POST /consumer/scans/upc**

Screen group: 07 Scan. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Code string, keep leading zeros. Retailer optional. Without retailer store:null. Optional customer token saves scan history. Camera band-photo recognition is a different, missing API.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "code": "{{upc}}",
  "retailerId": "{{retailerId}}"
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigar identified successfully",
  "data": {
    "cigar": {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170
    },
    "store": {
      "retailerId": "6a64312909e1ef36a786a017",
      "storeName": "Demo Shop",
      "available": true,
      "quantity": 8,
      "price": 15.5,
      "pricePerBox": 150,
      "location": {
        "humidorId": "6abb8b3598de3a28946dc896",
        "humidor": "Demo Humidor",
        "wallId": "6abb8b3598de3a28946dc88a",
        "wall": "Wall A",
        "shelfId": "6abb8b3598de3a28946dc88b",
        "shelf": "Top Shelf",
        "column": 4
      },
      "locations": [
        {
          "inventoryId": "6abb8b38ca05a7b9788d0fad",
          "available": true,
          "quantity": 8,
          "price": 15.5,
          "pricePerBox": 150,
          "location": {
            "humidorId": "6abb8b3598de3a28946dc896",
            "humidor": "Demo Humidor",
            "wallId": "6abb8b3598de3a28946dc88a",
            "wall": "Wall A",
            "shelfId": "6abb8b3598de3a28946dc88b",
            "shelf": "Top Shelf",
            "column": 4
          }
        }
      ]
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer/scans/upc' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"code":"{{upc}}","retailerId":"{{retailerId}}"}'
```

## lookupUpc

**GET /consumer/scans/upc/{{upc}}?retailerId={{retailerId}}**

Screen group: 07 Scan. Token: public; optional customer for personalized catalog/scan state. Source version: workspace-and-zip. HTTP success: 200.

Same result as POST scan; code string in URL.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigar identified successfully",
  "data": {
    "cigar": {
      "id": "6abb8af3ca05a7b9788d0f0e",
      "brand": "Romeo y Julieta",
      "productLine": "1875",
      "upcCodes": [
        "712345000002"
      ],
      "name": "Romeo y Julieta 1875 Bully",
      "manufacturer": "Altadis",
      "country": "Dominican Republic",
      "strength": "medium",
      "wrapper": "Indonesian",
      "binder": "Dominican",
      "filler": [
        "Dominican"
      ],
      "size": "5 x 50",
      "length": "5",
      "ringGauge": 50,
      "flavorNotes": [
        "Cedar",
        "Nuts",
        "Spice"
      ],
      "description": "A well-balanced, aromatic smoke.",
      "whyYoullLikeThis": "Consistent and approachable.",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "estimatedSmokingTime": "45",
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "suggestedRetailPriceEach": 8.5,
      "suggestedRetailPricePerBox": 170
    },
    "store": {
      "retailerId": "6a64312909e1ef36a786a017",
      "storeName": "Demo Shop",
      "available": true,
      "quantity": 8,
      "price": 15.5,
      "pricePerBox": 150,
      "location": {
        "humidorId": "6abb8b3598de3a28946dc896",
        "humidor": "Demo Humidor",
        "wallId": "6abb8b3598de3a28946dc88a",
        "wall": "Wall A",
        "shelfId": "6abb8b3598de3a28946dc88b",
        "shelf": "Top Shelf",
        "column": 4
      },
      "locations": [
        {
          "inventoryId": "6abb8b38ca05a7b9788d0fad",
          "available": true,
          "quantity": 8,
          "price": 15.5,
          "pricePerBox": 150,
          "location": {
            "humidorId": "6abb8b3598de3a28946dc896",
            "humidor": "Demo Humidor",
            "wallId": "6abb8b3598de3a28946dc88a",
            "wall": "Wall A",
            "shelfId": "6abb8b3598de3a28946dc88b",
            "shelf": "Top Shelf",
            "column": 4
          }
        }
      ]
    }
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/scans/upc/{{upc}}?retailerId={{retailerId}}' -H 'Accept: application/json'
```

## myCigars

**GET /consumer-cigars?type=favorites&page=1&limit=20**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

type favorites|want-to-try|smoked; omit for all user states. Outer _id is state record; use populated cigarId._id for master APIs. Optional removed master can populate null; handle it.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "My cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "000000000000000000000004",
      "userId": "000000000000000000000001",
      "cigarId": {
        "_id": "6abb8af3ca05a7b9788d0f0e",
        "brand": "Romeo y Julieta",
        "productLine": "1875",
        "name": "Romeo y Julieta 1875 Bully",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "strength": "medium",
        "wrapper": "Indonesian"
      },
      "isFavorite": true,
      "wantToTry": false,
      "hasSmoked": false,
      "rating": 5
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?type=favorites&page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## myWantToTry

**GET /consumer-cigars?type=want-to-try&page=1&limit=20**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

User-state list; master ID is nested cigarId._id. State examples hypothetical. No retailer price/location in this populated projection; open master detail and select shop.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "My cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "000000000000000000000004",
      "userId": "000000000000000000000001",
      "cigarId": {
        "_id": "6abb8af3ca05a7b9788d0f0e",
        "brand": "Romeo y Julieta",
        "productLine": "1875",
        "name": "Romeo y Julieta 1875 Bully",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "strength": "medium",
        "wrapper": "Indonesian"
      },
      "isFavorite": true,
      "wantToTry": true,
      "hasSmoked": false,
      "rating": 5
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?type=want-to-try&page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## mySmoked

**GET /consumer-cigars?type=smoked&page=1&limit=20**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

User-state list; master ID is nested cigarId._id. State examples hypothetical. No retailer price/location in this populated projection; open master detail and select shop.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "My cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "000000000000000000000004",
      "userId": "000000000000000000000001",
      "cigarId": {
        "_id": "6abb8af3ca05a7b9788d0f0e",
        "brand": "Romeo y Julieta",
        "productLine": "1875",
        "name": "Romeo y Julieta 1875 Bully",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "strength": "medium",
        "wrapper": "Indonesian"
      },
      "isFavorite": true,
      "wantToTry": false,
      "hasSmoked": true,
      "rating": 5
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?type=smoked&page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## myAllCigars

**GET /consumer-cigars?page=1&limit=20**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

User-state list; master ID is nested cigarId._id. State examples hypothetical. No retailer price/location in this populated projection; open master detail and select shop.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "My cigars retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "000000000000000000000004",
      "userId": "000000000000000000000001",
      "cigarId": {
        "_id": "6abb8af3ca05a7b9788d0f0e",
        "brand": "Romeo y Julieta",
        "productLine": "1875",
        "name": "Romeo y Julieta 1875 Bully",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "strength": "medium",
        "wrapper": "Indonesian"
      },
      "isFavorite": true,
      "wantToTry": false,
      "hasSmoked": false,
      "rating": 5
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## favorite

**POST /consumer-cigars/{{masterCigarId}}/favorite**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 201.

No request body. ID is active master cigar, never inventory. Mutation returns state with cigarId string; list populates cigarId object. No DELETE smoked route exists.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Cigar added to favorites",
  "data": {
    "_id": "000000000000000000000004",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "isFavorite": true,
    "wantToTry": false,
    "hasSmoked": false,
    "rating": 5
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/favorite' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## unfavorite

**DELETE /consumer-cigars/{{masterCigarId}}/favorite**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

No request body. ID is active master cigar, never inventory. Mutation returns state with cigarId string; list populates cigarId object. No DELETE smoked route exists.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigar removed from favorites",
  "data": {
    "_id": "000000000000000000000004",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "isFavorite": false,
    "wantToTry": false,
    "hasSmoked": false,
    "rating": 5
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X DELETE 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/favorite' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## wantToTry

**POST /consumer-cigars/{{masterCigarId}}/want-to-try**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 201.

No request body. ID is active master cigar, never inventory. Mutation returns state with cigarId string; list populates cigarId object. No DELETE smoked route exists.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Cigar added to want-to-try",
  "data": {
    "_id": "000000000000000000000004",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "isFavorite": true,
    "wantToTry": true,
    "hasSmoked": false,
    "rating": 5
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/want-to-try' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## removeWantToTry

**DELETE /consumer-cigars/{{masterCigarId}}/want-to-try**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

No request body. ID is active master cigar, never inventory. Mutation returns state with cigarId string; list populates cigarId object. No DELETE smoked route exists.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Cigar removed from want-to-try",
  "data": {
    "_id": "000000000000000000000004",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "isFavorite": true,
    "wantToTry": false,
    "hasSmoked": false,
    "rating": 5
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X DELETE 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/want-to-try' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## markSmoked

**POST /consumer-cigars/{{masterCigarId}}/smoked**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 201.

No request body. ID is active master cigar, never inventory. Mutation returns state with cigarId string; list populates cigarId object. No DELETE smoked route exists.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Cigar marked as smoked",
  "data": {
    "_id": "000000000000000000000004",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "isFavorite": true,
    "wantToTry": false,
    "hasSmoked": true,
    "rating": 5,
    "lastSmokedAt": "2026-10-03T10:00:00.000Z"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/smoked' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## rateCigar

**POST /consumer-cigars/{{masterCigarId}}/rating**

Screen group: 08 My Cigars. Token: customer required. Source version: workspace-and-zip. HTTP success: 201.

Required integer1–5; saved personal rating, not public average.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "rating": 5
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Cigar rating saved",
  "data": {
    "_id": "000000000000000000000004",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "isFavorite": true,
    "wantToTry": false,
    "hasSmoked": false,
    "rating": 5
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/rating' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"rating":5}'
```

## createJournal

**POST /journal**

Screen group: 09 Journal. Token: customer required. Source version: workspace-and-zip. HTTP success: 201.

Required cigarId active master; retailerId optional valid existing retailer; rating numeric1–5, notes max2000, flavorTags max20 strings, pricePaid>=0, smokedAt ISO optional, wouldSmokeAgain boolean. Automatically records smoked state and optional user rating.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "cigarId": "{{masterCigarId}}",
  "retailerId": "{{retailerId}}",
  "smokedAt": "2026-10-03T10:00:00.000Z",
  "rating": 5,
  "notes": "Smooth, cedar and nuts.",
  "flavorTags": [
    "cedar",
    "nuts"
  ],
  "strengthImpression": "medium",
  "pricePaid": 15.5,
  "wouldSmokeAgain": true
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Journal created successfully",
  "data": {
    "_id": "000000000000000000000002",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "retailerId": "6a64312909e1ef36a786a017",
    "smokedAt": "2026-10-03T10:00:00.000Z",
    "rating": 5,
    "notes": "Smooth, cedar and nuts.",
    "flavorTags": [
      "cedar",
      "nuts"
    ],
    "strengthImpression": "medium",
    "pricePaid": 15.5,
    "wouldSmokeAgain": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/journal' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"cigarId":"{{masterCigarId}}","retailerId":"{{retailerId}}","smokedAt":"2026-10-03T10:00:00.000Z","rating":5,"notes":"Smooth, cedar and nuts.","flavorTags":["cedar","nuts"],"strengthImpression":"medium","pricePaid":15.5,"wouldSmokeAgain":true}'
```

## journalList

**GET /journal?page=1&limit=20**

Screen group: 09 Journal. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

List populates references; create/update/delete may return raw ID strings. Optional searchTerm,rating,flavorTags,strengthImpression,smokedAt,wouldSmokeAgain,page,limit,sortBy,sortOrder. Set page/limit explicitly; default limit10.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Journals retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  },
  "data": [
    {
      "_id": "000000000000000000000002",
      "userId": {
        "_id": "000000000000000000000001",
        "email": "demo@example.com"
      },
      "cigarId": {
        "_id": "6abb8af3ca05a7b9788d0f0e",
        "brand": "Romeo y Julieta",
        "name": "Romeo y Julieta 1875 Bully",
        "image": "https://picsum.photos/seed/cigar-2/800/600",
        "strength": "medium",
        "wrapper": "Indonesian",
        "flavorNotes": [
          "Cedar",
          "Nuts",
          "Spice"
        ]
      },
      "retailerId": {
        "_id": "6a64312909e1ef36a786a017",
        "storeName": "Demo Shop",
        "address": "Example address",
        "city": "Example city"
      },
      "smokedAt": "2026-10-03T10:00:00.000Z",
      "rating": 5,
      "notes": "Smooth, cedar and nuts.",
      "flavorTags": [
        "cedar",
        "nuts"
      ],
      "strengthImpression": "medium",
      "pricePaid": 15.5,
      "wouldSmokeAgain": true
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/journal?page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## journalDetail

**GET /journal/{{journalId}}**

Screen group: 09 Journal. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Only own entry. Example minimal populated fields; actual selected master/user/retailer projections include more.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Journal retrieved successfully",
  "data": {
    "_id": "000000000000000000000002",
    "userId": "000000000000000000000001",
    "cigarId": {
      "_id": "6abb8af3ca05a7b9788d0f0e",
      "name": "Romeo y Julieta 1875 Bully"
    },
    "retailerId": {
      "_id": "6a64312909e1ef36a786a017",
      "storeName": "Demo Shop"
    },
    "smokedAt": "2026-10-03T10:00:00.000Z",
    "rating": 5,
    "notes": "Smooth, cedar and nuts.",
    "flavorTags": [
      "cedar",
      "nuts"
    ],
    "strengthImpression": "medium",
    "pricePaid": 15.5,
    "wouldSmokeAgain": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/journal/{{journalId}}' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## updateJournal

**PATCH /journal/{{journalId}}**

Screen group: 09 Journal. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Same optional editable fields excluding cigarId; retailerId:null clears retailer. Updates journal ranking signal but current service does not resync UserCigar.rating.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "notes": "Updated notes",
  "rating": 4
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Journal updated successfully",
  "data": {
    "_id": "000000000000000000000002",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "retailerId": "6a64312909e1ef36a786a017",
    "smokedAt": "2026-10-03T10:00:00.000Z",
    "rating": 4,
    "notes": "Updated notes",
    "flavorTags": [
      "cedar",
      "nuts"
    ],
    "strengthImpression": "medium",
    "pricePaid": 15.5,
    "wouldSmokeAgain": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X PATCH 'https://api.humidor411.com/api/v1/journal/{{journalId}}' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"notes":"Updated notes","rating":4}'
```

## deleteJournal

**DELETE /journal/{{journalId}}**

Screen group: 09 Journal. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Only own entry; returns deleted record. Does not automatically remove smoked/favorite state. Do not bulk-run deletes against real entries.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Journal deleted successfully",
  "data": {
    "_id": "000000000000000000000002",
    "userId": "000000000000000000000001",
    "cigarId": "6abb8af3ca05a7b9788d0f0e",
    "retailerId": "6a64312909e1ef36a786a017",
    "smokedAt": "2026-10-03T10:00:00.000Z",
    "rating": 5,
    "notes": "Smooth, cedar and nuts.",
    "flavorTags": [
      "cedar",
      "nuts"
    ],
    "strengthImpression": "medium",
    "pricePaid": 15.5,
    "wouldSmokeAgain": true
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X DELETE 'https://api.humidor411.com/api/v1/journal/{{journalId}}' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## accountProfile

**GET /user/profile**

Screen group: 10 Account. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Account profile, not taste profile. May include optional profilePicture,address,phoneNumber/dateOfBirth and additional DB fields.

Request headers: Accept application/json, Authorization Bearer accessToken. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "_id": "000000000000000000000001",
    "fullName": "Demo Customer",
    "email": "demo@example.com",
    "role": "customer",
    "status": "active",
    "verfied": "pending"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/user/profile' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## updateAccountProfile

**PUT /user/profile**

Screen group: 10 Account. Token: customer required. Source version: workspace-and-zip. HTTP success: 200.

Multipart text fullName; optional file profilePicture. Other editable personal fields address,phoneNumber,country,stateRegion,nationality,postcode,dateOfBirth ISO; send only intended profile fields. Postman file item disabled until selected.

Request headers: Accept application/json, Authorization Bearer accessToken, Content-Type multipart/form-data. No userId in body; token identifies customer.

Multipart: `fullName` text; optional `profilePicture` file.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "000000000000000000000001",
    "fullName": "Demo Customer Updated",
    "email": "demo@example.com",
    "role": "customer",
    "status": "active",
    "verfied": "pending"
  }
}
```

Parse: `data`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X PUT 'https://api.humidor411.com/api/v1/user/profile' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -F 'fullName=Demo Customer Updated' -F 'profilePicture=@/path/to/photo.jpg'
```

## guidedStoreGet

**GET /inventory/{{storeSlug}}/guided-discovery?strength=medium&minBudget=10&maxBudget=20&smokingTime=60&wrapper=Indonesian&pairingSuggestions=Coffee&profile=familiar&limit=6**

Screen group: 11 ZIP-only guided discovery. Token: public; optional customer for personalized catalog/scan state. Source version: zip-only. HTTP success: 200.

ZIP-only, absent current workspace. GET aliases wrapper/profile; smokingTime30|60|90|120+, strength enum, limit1–20. Website fallback invents score if endpoint missing. Confirm deployed route before using.

Request headers: Accept application/json. No userId in body; token identifies customer.

Request body: none. Path/query fields appear in URL; substitute actual IDs/slug.

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Guided discovery recommendations retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 6,
    "total": 1
  },
  "data": [
    {
      "_id": "6abb8b38ca05a7b9788d0fad",
      "name": "Romeo y Julieta 1875 Bully",
      "brand": "Romeo y Julieta",
      "strength": "medium",
      "size": "5 x 50",
      "smokingTime": "30",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "price": 15.5,
      "quantity": 8,
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "wallName": "Wall A",
      "shelfName": "Top Shelf",
      "shelfRow": 1,
      "shelfColumn": 4,
      "humidorName": "Demo Humidor",
      "wrapper": "Indonesian",
      "inStock": true,
      "rank": 1,
      "label": "Top Match",
      "matchScore": 85,
      "matchReason": "Illustrative match explanation"
    }
  ]
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/guided-discovery?strength=medium&minBudget=10&maxBudget=20&smokingTime=60&wrapper=Indonesian&pairingSuggestions=Coffee&profile=familiar&limit=6' -H 'Accept: application/json'
```

## guidedStorePost

**POST /inventory/{{storeSlug}}/guided-discovery**

Screen group: 11 ZIP-only guided discovery. Token: public; optional customer for personalized catalog/scan state. Source version: zip-only. HTTP success: 200.

ZIP-only, absent current workspace. POST DTO uses wrapperPreference/preference; pairing field present in ZIP DTO. Response/ranking differs from personalized endpoint.

Request headers: Accept application/json, Content-Type application/json. No userId in body; token identifies customer.

Request JSON:

```json
{
  "strength": "medium",
  "minBudget": 10,
  "maxBudget": 20,
  "smokingTime": "60",
  "wrapperPreference": "Indonesian",
  "pairingSuggestions": "Coffee",
  "preference": "familiar",
  "limit": 6
}
```

Response example (relevant fields; NOT live capture):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Guided discovery recommendations retrieved successfully",
  "data": [
    {
      "_id": "6abb8b38ca05a7b9788d0fad",
      "name": "Romeo y Julieta 1875 Bully",
      "brand": "Romeo y Julieta",
      "strength": "medium",
      "size": "5 x 50",
      "smokingTime": "30",
      "image": "https://picsum.photos/seed/cigar-2/800/600",
      "price": 15.5,
      "quantity": 8,
      "pairingSuggestions": [
        "Bourbon",
        "Coffee"
      ],
      "wallName": "Wall A",
      "shelfName": "Top Shelf",
      "shelfRow": 1,
      "shelfColumn": 4,
      "humidorName": "Demo Humidor",
      "wrapper": "Indonesian",
      "inStock": true,
      "rank": 1,
      "label": "Top Match",
      "matchScore": 85,
      "matchReason": "Illustrative match explanation"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 6,
    "total": 1
  }
}
```

Parse: `data[]`. Extra Mongoose fields such as createdAt, updatedAt, __v may appear.

Curl:

```bash
curl -X POST 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/guided-discovery' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"strength":"medium","minBudget":10,"maxBudget":20,"smokingTime":"60","wrapperPreference":"Indonesian","pairingSuggestions":"Coffee","preference":"familiar","limit":6}'
```

## Common error response

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Active cigar not found",
  "errorSources": [
    {
      "path": "",
      "message": "Active cigar not found"
    }
  ],
  "stack": null
}
```

400 validation → show field/message; 401 missing/expired token → re-login (no implemented refresh route); 403 wrong role/suspended → access error; 404 missing item/master/approved shop → not-found state; 409 registration duplicate; 5xx retry UI without treating data as empty stock. Invalid ObjectId on DTO routes400; legacy routes may report cast error. Never parse success shape on errors.
