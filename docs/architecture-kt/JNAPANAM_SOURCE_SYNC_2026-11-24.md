# Jnapanam-to-PlayNexa source sync review — 2026-11-24

## Source repository review
Reviewed `bv-prasanna/jnapanam-sports-zone` main and recent merged commits through 2026-11-22, plus open PR #96.

### New merged capabilities identified for parity
- PR/commit #92: PostgreSQL-safe public Shop catalogue query for optional category filtering.
- #93: isolate catalogue API failures so Shop settings/cart/orders remain usable, with retry and honest partial-load feedback.
- #94: Shop pickup/delivery selection, address validation, delivery fee/tax estimate display, and delivery payment wording/validation.
- #95: persist and expose counter-payment method, reference, collector and timestamp; idempotent counter collection.

These are source findings, not yet claimed as ported to PlayNexa. Each item requires a target-side implementation and regression test, with tenant-aware ownership checks preserved.

### Open source PR #96 reviewed
Production web/mobile clients must not silently fall back to localhost. The PlayNexa web client already avoids a production localhost fallback. This PR ports the equivalent release guard to the PlayNexa Expo client and adds a regression contract. Production and preview API URLs remain deployment-managed secrets/configuration and are not committed.

## PlayNexa implementation in this change
- Android emulator/localhost fallback is now limited to Expo development mode.
- Preview/production release clients require `EXPO_PUBLIC_API_URL`; missing configuration raises a safe `API_URL_NOT_CONFIGURED` error before refresh or API calls.
- Added contract tests for release guard and EAS named environments.

## Required parity work still open
1. Port #92 catalogue SQL correction and PostgreSQL integration test.
2. Port #93 partial Shop-load/retry UX and failure-isolation tests.
3. Port #94 delivery checkout with server-authoritative delivery fee/tax calculation; never trust client estimates for charged totals.
4. Port #95 auditable counter-payment fields with migration, actor authorization, idempotency and tenant scoping.
5. Re-run complete backend, web and mobile CI and browser/mobile UAT.

## Safety notes
- Do not cherry-pick Jnapanam branding, domain, app identifiers, credentials, or production environment values into PlayNexa.
- Do not port finance/schema changes without reconciling PlayNexa Flyway migration numbering and the actual target schema.
- The three hosting models must retain feature parity. SaaS remains blocked until tenant isolation covers commerce, bookings, payment/refund records, staff operations, files, events and background jobs.
- Marketplace is explicitly out of current scope.
