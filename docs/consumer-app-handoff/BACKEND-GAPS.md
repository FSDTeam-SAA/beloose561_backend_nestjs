# Backend work required for full requested consumer flow

The following are PROPOSED/missing or alignment tasks, not implemented APIs. They are intentionally excluded from runnable existing Postman requests.

## P1: All stockists for one master cigar

Proposed `GET /consumer/cigars/:masterCigarId/stores?page=1&limit=20`.

Response: envelope + paginated stores. Each store: retailerId, storeSlug, storeName, public address/logo/location, available, sellable quantity, locations[]. Each location: inventoryId, quantity, regularPrice/effectivePrice (define promotion policy), pricePerBox, humidorId/name, wallId/name, shelfId/name, row/column. Keep different location prices explicit; do not pretend a single price applies everywhere.

Join active master + approved retailer + active humidor + visible inventory. Define out-of-stock visibility and optional validated geo ordering. Group/paginate by retailer, not raw inventory. No private populated user/admin data. Master detail remains backward compatible. Do not use admin GET /inventory for consumer.

## P1: Version reconciliation

Port/reconcile ZIP GET/POST public guided-discovery with current backend before promising those calls in production. Its ranking algorithm differs from recommendations/me; decide whether web and app use the same guided route or personalized route in each screen. Remove synthetic fallback scores or label them appropriately.

## P1: Price and visibility consistency

Consumer availability currently uses regular inventory price; staff customer-view computes featured/discount display price but is retailer-authenticated. Define one public pricing rule and expose effective price server-side on public list/detail/stockists. Website public GET /inventory/:id uses unrestricted findById + populated objects; align visibility with approved retailer/active humidor/public item and project only public fields. Do not change response incompatibly without coordinating web/app.

## P2: Shelf and shop context

Add shelfRow to consumer availability projection, and optionally storeSlug/address/geo. Full shelf grid needs public layout/occupancy API scoped to visible shop/humidor/wall/shelf; never generate neighbouring cigar names from demo assets. Global stockist response can provide context needed for related calls.

## P2: Global feature browsing

Existing staff picks/new arrivals/daily featured are store-specific. Global home with no selected store requires explicit global aggregation contract (include store + inventory identities) or product decision to show a selected-store section. Global master-based similar API is missing; existing related is inventory+store specific.

## P2: Screens without backend contract

- Dedicated registration OTP/email confirmation versus existing password-reset OTP.
- Age verification/acknowledgement contract, if required by product flow.
- Photo cigar recognition (input media, recognition result/uncertainty, candidate masters).
- Public About/Privacy/Terms versioned app content.
- Refresh/logout endpoint if server session lifecycle is required; existing refresh cookie has no matching refresh controller.
- Custom named lists if Figma Your Lists means more than favorites/want-to-try/smoked.
- Public average rating/count if UI stars mean aggregate reviews; userState.rating is own rating.

New routes must have DTO/auth/public projection, documented examples, relevant service/HTTP validation checks, deployment confirmation and device integration tests. These tasks were identified, not implemented by this documentation handoff.
