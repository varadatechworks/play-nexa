# PlayNexa authentication, HTTP and API-route verification

> Source-based evidence guide, 10 November 2026. Complements [screen inventory](SCREEN_ROUTE_INVENTORY.md), [architecture](SYSTEM_ARCHITECTURE.md), [ER and payment model](ER_BOOKING_PAYMENTS.md), and [operations/KT](OPERATIONS_KT_UAT.md). **Not a live penetration test.**

## Machine-readable API source inventory

```bash
npm run audit:api
npm run audit:api -- --json > api-source-inventory.json
npm run audit:routes
```

The inventory lists Java `@RestController` mapping annotations, path/method, file and line for code review. It is **heuristic**: class path constants, arrays, overloaded/multiline annotations and non-controller routes may not appear exactly as they do at runtime. It must be reconciled with the **runtime OpenAPI spec from a secure UAT environment**, when that spec is available, and with Spring Security request matchers and `@PreAuthorize` for each method. Never expose production Swagger to anonymous users.

Review every booking, facility, payment, refund, invoice, customer document, audit, app-release, admin and operations route for anonymous/own-user/other-user/operator/admin access. All commercial booking routes must share the same behavior in customer-hosted, PlayNexa-managed single tenant and future tenant-isolated SaaS modes.

## Login and MFA contract

| Test | Expected client and API behavior |
|---|---|
| Unknown user or incorrect password | HTTP 401; generic invalid credentials; **do not** display MFA input |
| Correct password for privileged user with MFA enabled | HTTP 401, JSON `code=MFA_REQUIRED`; show six-digit MFA entry **only now** |
| Wrong six-digit code | Remain on login with actionable error; allow retry; never claim success |
| User edits username/password after MFA prompt | Hide MFA field and clear stale verification state |
| MFA delivery unavailable | Fail clearly, do not pretend the account is authenticated; capture safe correlation |
| Valid password + MFA | Save session only after successful login response and load authoritative profile |
| Access JWT expires | Attempt refresh once per installation/browser session; retry request after refresh |
| Rejected refresh token | Clear invalid token and report session expired; do not loop |
| Network offline or backend 500/503 | Retain otherwise valid refresh token; show temporary connectivity error |
| Authenticated but insufficient role | HTTP 403, no forced logout |
| Logout/revocation | Revoke refresh token and clear user state; subsequent protected calls receive 401 |

The previous web login bug was **client-side text matching**: a wrong-password error containing "verification code" could display an MFA input. The review replaces text heuristics with the backend's explicit `MFA_REQUIRED` problem code on both web and Android. The mobile login also clears stale MFA state on credential changes.

## API status, error and audit tests

| Scenario | API response | Client action | Diagnostics |
|---|---|---|---|
| Invalid field | 400/422 + safe validation details | Show correction without losing other fields | Error code, correlation ID |
| Wrong role | 403 | Show permission denied; remain signed in | Actor, operation, status |
| Missing/deleted object | 404 | Refresh or navigate to safe route | Sanitized path |
| Duplicate idempotency request | Existing result or domain conflict | Avoid duplicate charge | Same idempotency reference |
| Booking capacity conflict | 409 or documented capacity domain error | Refresh available slots; do not oversell | Slot/version, non-PII reference |
| Rate limit | 429 | Show cooldown; avoid tight retries | Throttle reason |
| Provider timeout | 504/5xx | Show pending/unknown; reconcile before retry | Correlation and payment order ID |
| Backend unavailable | 503 | Explain maintenance, no false success | Instance health, support reference |
| File too large | 413 | Ask user to select smaller file | File category only; never upload document body into logs |
| Payment callback before webhook | Pending until server verification | Reload authoritative booking state | Webhook/reconciliation status |
| Refund partially processed | Distinct partial status and amount | Display deduction and actual refund; issue credit note | Provider refund ID |

**No message should include** raw Java stack trace, SQL, refresh/JWT tokens, OTP, card details, webhook secret, identity document or an internal provider exception message. Diagnostic logs are accessible only to the intended administrative roles and must use redaction and retention settings.

## Booking → payments → refund UAT

1. From customer web/mobile select sport, facility and real available slot; verify prices and taxes match the backend.
2. Request quote and server-held slot; confirm concurrent second session cannot oversell.
3. Start Razorpay sandbox checkout; verify success is shown **only** after server verification and booking status transition.
4. Test declined payment, missing webhook, duplicate webhook, browser interruption, and expired hold without creating false confirmed bookings.
5. Download receipt/GST invoice; registered seller identity and arena brand must match selected arena.
6. Cancel future booking, process partial/full refund and no-show admin deduction with a mandatory reason; verify customer, operator, payment and tax document states agree.
7. Test login and role enforcement across the same flow, all 39 web page routes and mobile screen inventory. Repeat for both dedicated arrangements and separately for SaaS **only after tenant isolation is implemented**.

## Regression tooling

```bash
npm test
npm run audit:api
npm run audit:routes
npm run branding:audit
mvn -f apps/backend/pom.xml test
cd apps/web && npm ci && npm run build
cd ../mobile && npm ci && npx tsc --noEmit
```

The Node regression source contracts verify no string-based MFA decision reappears. **These are not full rendered UI tests**; staging browser and device UAT plus real payment sandbox and a fresh PostgreSQL migration/restore remain required.
