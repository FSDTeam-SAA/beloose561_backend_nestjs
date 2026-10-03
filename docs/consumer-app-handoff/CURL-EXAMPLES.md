# Curl templates — documentation, NOT an executable batch

Replace {{variables}} from Postman environment. Run one request deliberately. Bash syntax; PowerShell use curl.exe and its quoting rules. For shell portability, write JSON to request.json and use --data-binary @request.json.

## customerRegister (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/customer-register' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"fullName":"{{fullName}}","email":"{{email}}","password":"{{password}}"}'
```

## login (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/login' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}","password":"{{password}}"}'
```

## forgotPassword (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/forgot-password' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}"}'
```

## verifyResetOtp (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/verify' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}","otp":"{{otp}}"}'
```

## resetPassword (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/reset-password' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"email":"{{email}}","newPassword":"{{newPassword}}"}'
```

## changePassword (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/auth/change-password' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"oldPassword":"{{password}}","newPassword":"{{newPassword}}"}'
```

## getTasteProfile (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-profile/me' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## completeOnboarding (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-profile/onboarding' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"experienceLevel":"experienced","preferredStrengths":["medium"],"preferredWrappers":["Indonesian"],"preferredFlavors":["Cedar","Nuts"],"preferredOrigins":["Dominican Republic"],"preferredSmokingTimes":["45"],"favoriteBrands":["Romeo y Julieta"],"minBudget":10,"maxBudget":20}'
```

## updateTasteProfile (workspace-and-zip)

```bash
curl -X PATCH 'https://api.humidor411.com/api/v1/consumer-profile/me' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"preferredStrengths":["medium"],"minBudget":10,"maxBudget":20}'
```

## catalog (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars?page=1&limit=20' -H 'Accept: application/json'
```

## catalogSearch (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars?search=Romeo&strength=medium&page=1&limit=20' -H 'Accept: application/json'
```

## storeCatalog (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars?retailerId={{retailerId}}&page=1&limit=20' -H 'Accept: application/json'
```

## masterDetail (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars/{{masterCigarId}}' -H 'Accept: application/json'
```

## masterStoreDetail (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/cigars/{{masterCigarId}}?retailerId={{retailerId}}' -H 'Accept: application/json'
```

## recommendGlobal (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/recommendations/me?limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## recommendStore (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/recommendations/me?retailerId={{retailerId}}&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## nearbyShops (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/retailer/nearby?lat={{lat}}&lng={{lng}}&radius=5000&page=1&limit=20' -H 'Accept: application/json'
```

## shopBySlug (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/retailer/slug/{{storeSlug}}' -H 'Accept: application/json'
```

## shopById (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/retailer/{{retailerId}}' -H 'Accept: application/json'
```

## storeInventory (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/inventory-list?page=1&limit=20' -H 'Accept: application/json'
```

## storeInventorySearch (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/inventory-list?searchTerm=Romeo&minPrice=10&maxPrice=20&page=1&limit=20' -H 'Accept: application/json'
```

## staffPicks (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/staff-picks' -H 'Accept: application/json'
```

## newArrivals (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/new-arrivals' -H 'Accept: application/json'
```

## dailyFeatured (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/daily-featured' -H 'Accept: application/json'
```

## inventoryDetail (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{inventoryId}}' -H 'Accept: application/json'
```

## related (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/{{inventoryId}}/related' -H 'Accept: application/json'
```

## exclusive (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/{{inventoryId}}/exclusive-picks' -H 'Accept: application/json'
```

## surprise (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/surprise-me?exclude={{excludeInventoryIds}}' -H 'Accept: application/json'
```

## resolveStoreQr (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/qrcodes/resolve-store' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"value":"{{storeQrUrl}}"}'
```

## scanUpc (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer/scans/upc' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"code":"{{upc}}","retailerId":"{{retailerId}}"}'
```

## lookupUpc (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer/scans/upc/{{upc}}?retailerId={{retailerId}}' -H 'Accept: application/json'
```

## myCigars (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?type=favorites&page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## myWantToTry (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?type=want-to-try&page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## mySmoked (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?type=smoked&page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## myAllCigars (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/consumer-cigars?page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## favorite (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/favorite' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## unfavorite (workspace-and-zip)

```bash
curl -X DELETE 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/favorite' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## wantToTry (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/want-to-try' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## removeWantToTry (workspace-and-zip)

```bash
curl -X DELETE 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/want-to-try' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## markSmoked (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/smoked' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## rateCigar (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/consumer-cigars/{{masterCigarId}}/rating' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"rating":5}'
```

## createJournal (workspace-and-zip)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/journal' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"cigarId":"{{masterCigarId}}","retailerId":"{{retailerId}}","smokedAt":"2026-10-03T10:00:00.000Z","rating":5,"notes":"Smooth, cedar and nuts.","flavorTags":["cedar","nuts"],"strengthImpression":"medium","pricePaid":15.5,"wouldSmokeAgain":true}'
```

## journalList (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/journal?page=1&limit=20' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## journalDetail (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/journal/{{journalId}}' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## updateJournal (workspace-and-zip)

```bash
curl -X PATCH 'https://api.humidor411.com/api/v1/journal/{{journalId}}' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -H 'Content-Type: application/json' --data-binary '{"notes":"Updated notes","rating":4}'
```

## deleteJournal (workspace-and-zip)

```bash
curl -X DELETE 'https://api.humidor411.com/api/v1/journal/{{journalId}}' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## accountProfile (workspace-and-zip)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/user/profile' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}'
```

## updateAccountProfile (workspace-and-zip)

```bash
curl -X PUT 'https://api.humidor411.com/api/v1/user/profile' -H 'Accept: application/json' -H 'Authorization: Bearer {{accessToken}}' -F 'fullName=Demo Customer Updated' -F 'profilePicture=@/path/to/photo.jpg'
```

## guidedStoreGet (zip-only)

```bash
curl -X GET 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/guided-discovery?strength=medium&minBudget=10&maxBudget=20&smokingTime=60&wrapper=Indonesian&pairingSuggestions=Coffee&profile=familiar&limit=6' -H 'Accept: application/json'
```

## guidedStorePost (zip-only)

```bash
curl -X POST 'https://api.humidor411.com/api/v1/inventory/{{storeSlug}}/guided-discovery' -H 'Accept: application/json' -H 'Content-Type: application/json' --data-binary '{"strength":"medium","minBudget":10,"maxBudget":20,"smokingTime":"60","wrapperPreference":"Indonesian","pairingSuggestions":"Coffee","preference":"familiar","limit":6}'
```

