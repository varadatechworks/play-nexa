# PlayNexa second-pass source UI, security, status, audit and KT review

**Review date:** 2026-11-10  
**Repository:** `varadatechworks/play-nexa`, `main`  
**Verification level:** source review and GitHub commits; **not** a live browser/device or production security certification.

## Scope and method

The current repository contains **39 Next.js page files** and **20 Expo mobile screens** (59 direct page source files), plus Spring Boot APIs, PostgreSQL/Flyway migrations and three deployment-model contracts. All 59 page files were fetched from current GitHub source and scanned for direct legacy venue text, raw network failure strings, browser alerts and console debugging. The scan is intentionally shallow (it does not inspect all imported images, CSS, provider components or rendered content) and cannot establish that any specific page passes UAT.

**Observed page-source scan results:**

| Static pattern | Web page matches | Mobile screen matches | Interpretation |
|---|---:|---:|---|
| Legacy `Jnapanam`/`Holalkere` text | 0 | 0 | No *direct page-source* matches, not a cleared full asset audit |
| Raw `Failed to fetch`, `fetch failed`, `Internal Server Error` | 0 | 0 | Shared transport and provider messages require separate inspection |
| `console.log`/`console.error` | 0 | 0 | Does not prove log privacy |
| Browser-style `alert()` pattern | 0 | 10 | Mobile occurrences are React Native `Alert.alert` confirmations, not browser dialogs |

The ten mobile native confirmation matches appear across bookings, operations, shop-counter, shop and subscriptions. React Native `Alert.alert` is not inherently an issue. Review language, action confirmation, payment semantics and accessible alternatives on physical devices before deciding to replace.

Full route list: [screen and route inventory](SCREEN_ROUTE_INVENTORY.md).

## Source-level defects corrected in this pass

| Workstream | Defect or risk | Source change |
|---|---|---|
| Web login | Wrong-password message contained “verification code” and could display MFA field despite no challenge | Display MFA only when backend sends `code=MFA_REQUIRED` |
| Expo login | MFA detection depended on substring in translated error text | Use structured `ApiError.code`, never text matching |
| MFA delivery | SMTP outage could surface generic 500 instead of a precise user-safe error | Return 503 when delivery fails; do not persist/claim an undelivered challenge |
| API error handling | Missing query parameter, unsupported method/media type and oversized file could fall through to broad 500 | Add safe explicit 400/405/415/413/404 handlers |
| Audit privacy | Client-provided `X-Forwarded-For` could impersonate an audit IP; path could include UUID/email | Use socket remote IP, validated correlation fallback, redact path identifiers |
| Dedicated production | Missing hosting-mode variable defaulted to dedicated | Require explicit `PLAYNEXA_HOSTING_MODE=dedicated` in production |
| White label | Customer welcome message hardcoded the imported venue name | Use dedicated arena's configured brand name; generic PlayNexa fallback |
| Build metadata | Imported venue appeared in Maven project title and web metadata | Rename packaging descriptions to PlayNexa without changing compatibility-sensitive artifact coordinates |
| Schema handover | Manual physical DDL export was not scripted alongside Flyway planning | Add read-only schema and Flyway-history export script, with file permissions and Git exclusion |

**Regression source added:** web and mobile MFA contracts; Java API status tests; audit spoofing tests; explicit hosting-mode guard test. Existing `MfaServiceTest` and notification integration expectations were updated for the safe 503 and branded welcome message. These are committed test sources; **the current branch's Maven/TypeScript/test executions have not been independently verified**.

## Page families: mandatory UAT state/role/negative checks

| Page family | Routes / screens | Must be checked in running staging |
|---|---|---|
| Public & marketing | `/`, `/about`, `/sports`, `/gallery`, `/events`, `/services`, `/contact` | Arena-specific brand/media/licensing, local currency, correct live sports, empty and loading states |
| Identity | `/login`, `/register`, `/forgot-password`; matching Expo screens | Wrong password never creates MFA; correct admin requires delivered OTP; 401 vs 403; cooldown 429; no token/OTP in logs |
| Customer booking | `/dashboard`, `/app`, sports, Expo explore/bookings | Slot inventory, capacities, stale holds, 409 races, checkout pending vs captured, back/refresh/offline handling |
| Finance | `/billing-profile`, `/billing-documents/[id]`, subscriptions and mobile billing/payment return | Tax snapshots, invoices/credit notes, no-show deductions, refund pending/processed status and reconciliation |
| Membership & training | `/memberships`, `/account-services`, `/subscriptions`, mobile training/tournaments | Limits, schedule and cancellation policy, payment verification and accessible input |
| Staff operations | `/operations`, `/operations/front-desk`, `/shop-counter`, mobile check-in/operations | QR and identity checks, concurrent check-in, slot filters, no-show, correct staff scope |
| Admin and arena onboarding | `/admin/*`, branding, users, verification, pricing, billing, errors, features, release, providers | Admin and super-admin permission boundaries, role-dependent nav, safe audit exports, revised branding and version gates |
| Commerce and loyalty | `/shop`, admin commerce, mobile shop/counter/growth | Inventory/price consistency, duplicate submits, failed pickup payment, tax/refund/loyalty consistency |

For every page: test 320/360/390/768/1440-pixel viewport widths, keyboard/focus, screen-reader labels, dynamic Kannada/English overflow, loading/empty/error/success states, offline retry, logout/back navigation, and ownership isolation. Record screenshots and case IDs per version. **Do not mark a route reviewed in UAT based on the source scan alone.**

## Server-side status and log contract

| Response | Customer / operator message | Backend obligation |
|---|---|---|
| 200/201/204 | Action confirmed, or no-content confirmation | Committed server state, not merely a button click |
| 202 | Request accepted / pending | Do not show settled/sent/refunded when still processing |
| 400/422 | Correct specific entered fields | Suppress Java/SQL details and invalid raw values |
| 401 | Invalid login/session | Distinct `MFA_REQUIRED` only after actual email challenge |
| 403 | Permission denied | Do not log out a valid user; server-enforced RBAC |
| 404 | Not found / not accessible | Avoid existence disclosure across arenas |
| 405/415 | Unsupported action/content type | Explicit safe machine-readable status |
| 409 | Capacity, duplicate, or stale revision | Conflict-safe operation and recovery path |
| 413 | File too large | Display supported upload limits |
| 426 | Upgrade needed | Correct **arena-branded** APK/QR and version policy |
| 429 | Too many attempts | Rate limit and user cooldown |
| 500/502/503/504 | Service temporarily unavailable with reference | No leaked internal details; reconcile uncertain payments and refunds |

Operational logging: sanitize HTTP path, log status, duration and correlation ID, never request bodies/headers with secrets or untrusted client-provided forwarding as a verified IP. Geo evidence on mutations remains **consent-based and client-reported**. Configure retention and restricted admin views.

## Deployment, migrations, diagrams and maintainability

**Architecture and deployment diagrams:**
- [System architecture and service boundaries](SYSTEM_ARCHITECTURE.md)
- [Customer-hosted, managed dedicated and *blocked target* SaaS diagrams](DEPLOYMENT_TOPOLOGIES.md)
- [Booking/payment/tax/commerce ER](ER_BOOKING_PAYMENTS.md)
- [Membership, training, tournament, loyalty and audit ER](ER_EXTENDED_MODULES.md)
- [Schema dictionary / versioned SQL catalogue](SCHEMA_INDEX.md)

**Database source:** `apps/backend/src/main/resources/db/migration`, currently **59 versioned SQL files**, V1–V60 **with no V42**. The different Jnapanam repository has its own migration lineage. Never copy an overlapping version number and “repair” checksums to force it through.

**Read-only commands:**

```bash
npm run audit:routes
npm run branding:audit
bash scripts/migrate-playnexa.sh plan

# Operator-only, read-only PostgreSQL schema + Flyway metadata export
export PGHOST=<approved-host> PGDATABASE=<database> PGUSER=<read-only-role>
# PG password supplied through an approved secret mechanism
bash scripts/schema-export-playnexa.sh
```

**Approved deployment:** [migration runbook](MIGRATION_RUNBOOK.md) requires exact release SHA, backup, restore test and a Flyway validate before migrate. For production set `APP_ENV=production`, `PLAYNEXA_HOSTING_MODE=dedicated`, isolated per-arena DB/JWT/provider credentials, exact HTTPS CORS, supported Android signature, no fixed OTP, no mock payment provider. All provider credentials belong in secret management; real payment and refund UAT must be in sandbox before production approval.

**Monitoring:** daily booking/payment discrepancies, webhook retries, stuck holds, failed refunds, mail/SMS delivery and 5xx by route. Weekly backup verification, 401/403/429 spikes, Android update rollout and expiration of TLS certificates. Monthly access review, dependency security updates, retention and restore rehearsal.

**KT demo:** arena admin updates branding; adds facilities/operating periods; customer creates booking and checks payment state; operator checks in using QR; admin reviews cancellation, partial refund and GST credit note; then trace a safe support reference, run a guarded migration plan and show backup/restore evidence. Capture release SHA, environment, tester, date and signed evidence.

## Release judgement

- **Dedicated environments:** repository source and documentation are available, but build/host/provider configuration, real data isolation, test execution and per-route device UAT still require evidence. Do not certify completion.
- **Shared SaaS:** **NO-GO**. No end-to-end tenant-scoped DB, auth, payment, webhook, media, export and job isolation; safety gate must stay enabled.
- **Live marketplace:** **NOT AVAILABLE**. The demo remains synthetic with no authoritative cross-arena reservation/payment handoff.
- **Production:** no release approval based on static inspection. See [operations/UAT/KT](OPERATIONS_KT_UAT.md) for evidence checklist.
