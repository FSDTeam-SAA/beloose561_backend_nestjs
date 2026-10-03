# Flutter integration examples

Starter files reuse existing Dio; no new package dependency. Copy consumer_api.dart + consumer_endpoints.dart into a suitable data/network folder, then adapt repository/controller imports. Dart/Flutter runtime unavailable in this workspace: snippets are not analyzer/device-tested. Backend gaps are not solved by this client.

Use a Dio instance whose interceptors do not blindly refresh through nonexistent /auth/refresh-token, append /api/v1 again, or log passwords/tokens. Store-context cache keys must include retailerId/storeSlug. On logout clear token, personal cache, and selected store context.

```dart
final api = ConsumerApi(
  dio: existingDio,
  readAccessToken: () async => await yourSecureStorage.readAccessToken(),
);

// Login: preserve token securely; do not hardcode it.
final login = await api.call('login', body: {
  'email': email.trim(), 'password': password,
});
final token = login.object()['accessToken'] as String;
await yourSecureStorage.saveAccessToken(token);

// Global list with true server pagination.
final page = await api.call('catalog', query: {'page': 1, 'limit': 20});
final cigars = page.list();
final total = (page.meta?['total'] as num?)?.toInt() ?? 0;
final masterId = cigars.first['id'] as String;

// Detail without selected store: storeAvailability is null.
final globalDetail = await api.call('masterDetail',
  variables: {'masterCigarId': masterId},
  sendOptionalCustomerToken: true,
);

// Resolve real QR scanned value, not a demo shop.
final resolved = await api.call('resolveStoreQr',
  body: {'value': scannedQrUrl},
);
final shop = resolved.object();
final retailerId = shop['retailerId'] as String;
final slug = shop['storeSlug'] as String;

// Store master detail: all actual locations for this master.
final response = await api.call('masterStoreDetail', variables: {
  'masterCigarId': masterId, 'retailerId': retailerId,
}, sendOptionalCustomerToken: true);
final details = response.object();
final availability = details['storeAvailability'] as Map<String, dynamic>;
final locations = ConsumerResponse.mapList(availability['locations']);
// Let the user select location; do not silently merge different prices.
final selected = locations.first;
final inventoryId = selected['inventoryId'] as String;
final price = nullableMoney(selected['price']);

// Website-equivalent inventory + same-store related.
final item = (await api.call('inventoryDetail',
  variables: {'inventoryId': inventoryId})).object();
final masterReference = referenceId(item['masterCigarId']);
final related = (await api.call('related', variables: {
  'storeSlug': slug, 'inventoryId': inventoryId,
})).object();
final similar = ConsumerResponse.mapList(related['similarCigars']);

// Feature items are nested data.data, NOT data[].
final picks = (await api.call('staffPicks',
  variables: {'storeSlug': slug})).featureList();

// My cigars are user-state rows; nested cigarId identifies the master.
final saved = (await api.call('myCigars')).list();
final savedMasterId = referenceId(saved.first['cigarId']);

await api.call('favorite', variables: {'masterCigarId': masterId});
await api.call('rateCigar', variables: {'masterCigarId': masterId},
  body: {'rating': 5});

// UPC without selected shop: omit optional retailerId in body.
final scan = await api.call('scanUpc', body: {'code': barcodeString});
final foundCigar = scan.object()['cigar'];

// Avatar: FormData, not JSON and no manually fixed multipart boundary.
await api.call('updateAccountProfile', body: FormData.fromMap({
  'fullName': fullName,
  'profilePicture': await MultipartFile.fromFile(localPhotoPath),
}));
```

Variables such as existingDio/yourSecureStorage are integration placeholders, not existing repository symbols. Guard empty lists before `.first`; examples assume successful nonempty fixtures to explain parsing.

Recommended GetX controllers: ConsumerHomeController, DiscoverController, CigarDetailsController, StoreContextController, MyCigarsController, ScanController, TasteProfileController. Inject repositories with existing DI. Each screen handles initial loading, loading-more, error/retry, empty/not-found, success, and action pending. Cancel stale searches; disable repeated save taps. Consumer home must not call generic dream-board HomeRepository.

All-cigar → all shops requires the proposed stores endpoint; do not loop every retailer or fabricate a retailerId from customer user ID. Until implemented, show product information with a clear Select shop action and route to actual nearby/store selection.
