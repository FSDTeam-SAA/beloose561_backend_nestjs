# Humidor411 consumer app — developer handoff

এই package app/API integration specification এবং starter code। এটি deploy করা বা Flutter screens-এ সম্পূর্ণ integrate করা runnable app নয়। User-supplied mobile-flow screenshots ও চারটি ZIP এবং current backend source মিলিয়ে তৈরি। Live authenticated calls, emails, saved state changes বা device tests করা হয়নি। Response examples source-derived, production captures নয়।

## Developer-কে কী দেবেন

- `API-REFERENCE.md`: প্রতিটি request-এর method, URL, auth, body, response example, parser, validation এবং curl।
- `SCREEN-MAPPING-BN.md`: screen → API এবং website/app differences, ID rules, missing contracts।
- `Humidor411.postman_collection.json`: existing consumer calls ও আলাদা ZIP-only guided folder; saved response examples।
- `Humidor411.postman_environment.json`: base URL, credentials, IDs, slug, QR, UPC, token variables।
- `api-contract.json`: machine-readable contract/examples; no secrets।
- `CURL-EXAMPLES.md`: সব request-এর copyable templates; individual usage।
- `flutter/consumer_api.dart`, `consumer_endpoints.dart`: Dio client, envelope/meta parsing, ID helpers, complete endpoint registry।
- `flutter/INTEGRATION-EXAMPLES.md`: login/list/detail/store/related/favorite/scan/avatar call examples এবং controller guidance।
- `BACKEND-GAPS.md`: backend developer-এর remaining কাজ; missing routes collection-এ existing হিসেবে রাখা হয়নি।
- `ERRORS-AND-EMPTY-STATES.md`: null profile, empty list, unknown availability, out-of-stock ও error UI rules।

মোট ৫০টি request template: ৪৮টি current source-backed operation/variant, ২টি ZIP-only guided GET/POST। এগুলো ৫০টি আলাদা নতুন endpoint নয়; search/filter/list variants-ও আছে।

## Postman setup

1. Collection + environment Import; environment select।
2. `email`, `password`, `fullName`, real `storeSlug`, `storeQrUrl` পূরণ। Saved IDs user-provided sample; নিজের environment-এ existence verify।
3. Login/registration response success হলে token automatically environment-এর `accessToken`-এ save হয়। Credentials package-এ intentionally blank।
4. Public catalog → master detail; store inventory → inventory detail; পরে related।
5. Personal recommendation/onboarding/favorites/journal-এর জন্য customer token লাগবে।
6. ZIP-only guided API deploy আছে কি না নিশ্চিত করে ওই folder ব্যবহার।

Collection-এর সব requests একসাথে production-এ Run All করবে না: signup/email/password/state/journal mutations বাস্তব effect করে। Demo response examples শুধু documentation; Postman request পাঠালে real server hit হবে।

## App screen flow

```text
Sign up / Login
  → Taste profile onboarding
  → Home: catalog + personal recommendations
  → Global cigar detail
     → product info (existing)
     → all-stockist list (BACKEND GAP)
     → shop selection
        → retailerId + storeSlug + inventoryId
        → stock/price/location detail + related cigars

Nearby / Store QR
  → selected shop context
  → inventory / staff picks / new arrivals / daily featured
  → inventory detail + related

UPC scan
  → master product + selected-shop availability if retailerId provided

My Cigars / Profile / Journal
  → authenticated personal resources
```

Staff Picks current APIs are per store, so global home must select/show store context or backend must add global feature aggregation. Personal recommendation requires token; guest home can use catalog/store features.

## Figma/screens → special rules

- Age verification UI: dedicated backend workflow missing; dateOfBirth field alone is not verification.
- Q1–Q4: save experience, strengths, wrappers/flavors/time/budget to profile DTO; map actual UI labels. Drink pairing has only ZIP guided input, no persisted consumer preference field.
- Product details: actual stock + per-location price; shelf row currently available on inventory detail, absent consumer location. A full neighbouring shelf grid is not provided by master detail.
- My Cigar/Your Lists: favorites, want-to-try, smoked are existing saved-state categories; no custom named-list CRUD found.
- Cigar photo scan: simulated app flow; photo recognition endpoint missing. UPC and Store QR APIs are real separate functions.
- About/Privacy/Terms: no identified public mobile content endpoint; admin `/settings` cannot be called by consumer.
- Logout: clear local session; no server logout/refresh route in audited controller. Signup OTP is not implemented; `/auth/verify` is reset OTP.

## Acceptance criteria before delivery

1. Remove demo cigar, shop, shelf, rating and image defaults from API-driven screens.
2. Replace local IP and unrelated dream/goal endpoints; correct auth routes/methods.
3. Persist four identifiers separately: masterCigarId, inventoryId, retailerId, storeSlug.
4. Correct envelope/meta/nested feature parsing; optional values stay unknown instead of zero.
5. Compare same inventory record website vs device: regular price, quantity, location. Define promotional price policy server-side.
6. Test no shop, no profile, empty list, inactive/out-of-stock, multiple positions/prices, stale search, 401/403/404 and network loss.
7. Apply missing global stockist/shelf/content/scan contracts before claiming all requested Figma flows complete.
8. Run Flutter analyze + existing tests + real device checks. Dart/Flutter unavailable here, so starter code requires this verification.

## Evidence and versions

Catalog, scan, recommendation: supplied backend ZIP matches current inspected sources. ZIP inventory controller includes public GET/POST guided-discovery missing in current workspace. Website fallback generates its own guided score when route fails; personal recommendation and guided ranking are different systems. Neither score is measured confidence.

Docs-only handoff: backend business code and extracted Flutter project unchanged. See BACKEND-GAPS before scheduling final integration delivery.

Generated JSON/Postman examples, unique request keys, environment variables, response envelope/list shapes এবং ৫০টি route/source matching check passed। Live server এবং Dart compiler/device verification হয়নি। `generate.cjs` artifacts regenerate করে; `verify.cjs` artifact consistency/source route checks করে, network call নয়।
