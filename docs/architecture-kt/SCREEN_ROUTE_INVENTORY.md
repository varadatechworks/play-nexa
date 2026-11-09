# Page-by-page UI/UX and security review inventory

> Generated from the PlayNexa source tree on 10 November 2026. **39 Next.js page files and 20 Expo screen files** found. This is a route **inventory**, not a claim that each page was rendered, clicked or penetration-tested. Dynamic UAT must still take place using a deployed PlayNexa test database and approved test users.

## Web pages (all currently discovered)

| Route | Domain | Review status |
|---|---|---|
| `/about` | Customer / public | Source discovered; interactive QA pending |
| `/account-services` | Customer / public | Source discovered; interactive QA pending |
| `/admin/app-management` | Admin | Source discovered; interactive QA pending |
| `/admin/arena-branding` | Admin | Source discovered; interactive QA pending |
| `/admin/billing` | Admin | Source discovered; interactive QA pending |
| `/admin/bookings` | Admin | Source discovered; interactive QA pending |
| `/admin/commerce` | Admin | Source discovered; interactive QA pending |
| `/admin/errors` | Admin | Source discovered; interactive QA pending |
| `/admin/features` | Admin | Source discovered; interactive QA pending |
| `/admin/notification-providers` | Admin | Source discovered; interactive QA pending |
| `/admin/operator-assignments` | Admin | Source discovered; interactive QA pending |
| `/admin` | Admin | Source discovered; interactive QA pending |
| `/admin/player-growth` | Admin | Source discovered; interactive QA pending |
| `/admin/pricing` | Admin | Source discovered; interactive QA pending |
| `/admin/release-readiness` | Admin | Source discovered; interactive QA pending |
| `/admin/subscriptions` | Admin | Source discovered; interactive QA pending |
| `/admin/uat-otp` | Admin | Source discovered; interactive QA pending |
| `/admin/users` | Admin | Source discovered; interactive QA pending |
| `/admin/verification` | Admin | Source discovered; interactive QA pending |
| `/app` | Customer / public | Source discovered; interactive QA pending |
| `/billing-documents/[id]` | Customer / public | Source discovered; interactive QA pending |
| `/billing-profile` | Customer / public | Source discovered; interactive QA pending |
| `/contact` | Customer / public | Source discovered; interactive QA pending |
| `/dashboard` | Customer / public | Source discovered; interactive QA pending |
| `/events` | Customer / public | Source discovered; interactive QA pending |
| `/forgot-password` | Authentication | Source discovered; interactive QA pending |
| `/gallery` | Customer / public | Source discovered; interactive QA pending |
| `/login` | Authentication | Source discovered; interactive QA pending |
| `/memberships` | Customer / public | Source discovered; interactive QA pending |
| `/operations/front-desk` | Operations | Source discovered; interactive QA pending |
| `/operations` | Operations | Source discovered; interactive QA pending |
| `/` | Customer / public | Source discovered; interactive QA pending |
| `/profile` | Customer / public | Source discovered; interactive QA pending |
| `/register` | Authentication | Source discovered; interactive QA pending |
| `/services` | Customer / public | Source discovered; interactive QA pending |
| `/shop-counter` | Operations | Source discovered; interactive QA pending |
| `/shop` | Customer / public | Source discovered; interactive QA pending |
| `/sports` | Customer / public | Source discovered; interactive QA pending |
| `/subscriptions` | Customer / public | Source discovered; interactive QA pending |

## Expo mobile screens (all currently discovered)

| Screen file without extension | Review status |
|---|---|
| `admin` | Source discovered; device QA pending |
| `billing` | Source discovered; device QA pending |
| `bookings` | Source discovered; device QA pending |
| `checkin` | Source discovered; device QA pending |
| `explore` | Source discovered; device QA pending |
| `forgot-password` | Source discovered; device QA pending |
| `growth` | Source discovered; device QA pending |
| `index` | Source discovered; device QA pending |
| `login` | Source discovered; device QA pending |
| `memberships` | Source discovered; device QA pending |
| `notifications` | Source discovered; device QA pending |
| `operations` | Source discovered; device QA pending |
| `payment-return` | Source discovered; device QA pending |
| `profile` | Source discovered; device QA pending |
| `register` | Source discovered; device QA pending |
| `shop-counter` | Source discovered; device QA pending |
| `shop` | Source discovered; device QA pending |
| `subscriptions` | Source discovered; device QA pending |
| `tournaments` | Source discovered; device QA pending |
| `training` | Source discovered; device QA pending |

## Repeatable static inspection

Run:

```bash
npm run audit:routes
npm run audit:routes -- --json
npm run branding:audit
```

The read-only audit scans every web page and mobile screen for legacy Jnapanam branding, localhost endpoints, unhelpful raw network errors, browser alerts and console diagnostics. It generates file/line numbers. **A flagged string may be legitimate** (e.g. release documentation or a stub), and an unflagged page is not proven accessible or secure.

## Manual QA matrix for EVERY route

| Dimension | Test | Evidence/sign-off |
|---|---|---|
| Correct role | Anonymous, customer, operator, coach, shopkeeper, admin and SUPER_ADMIN | Pending |
| Responsiveness | 320/360/390px mobile, tablet, 1440px desktop, long content, scroll/back | Pending |
| Data correctness | Live API and server records match screen; no dummy Jnapanam data | Pending |
| State feedback | Loading, empty, success, validation, 400/401/403/404/409/429/5xx | Pending |
| Form behavior | Required fields, field errors, retry safety, no duplicate submit | Pending |
| Payments and refunds | Webhook race, double click, no-show, deductions, receipt/invoice | Pending |
| Security | Cross-role access, XSS, CSRF assumptions, rate limiting, PII logging | Pending |
| Language/accessibility | English/Kannada, keyboard/focus, contrast, labels and screen readers | Pending |
| Media/branding | Arena-specific logos, assets, domain, APK/QR and no imported Jnapanam branding | Pending |
| Diagnostics | Correlation ID, appropriate HTTP code, admin error entry (no secrets) | Pending |

## High-priority routes and cross-screen flows

**Customer:** home → sports → availability/slots → quote/hold → checkout → payment-return → booking details → receipt → cancellation/refund → membership or coaching. The frontend must never claim a paid booking merely from a payment UI callback without server verification.

**Admin:** dashboard → sports/facilities/operating periods → pricing/taxes → payments/refunds → invoicing → user/role management → notifications → errors/audit → app-version settings → branded identity.

**Operator:** facility assignment → Today/Tomorrow/Day-After slot and booking counts → QR/manual check-in → check-out / no-show → refund escalation → closing summary.

**Mobile:** OTP/MFA login → homepage / role menus → booking/payment deep-link return → booking details and scrolling → operator QR/check-in → notifications → session recovery and optional/mandatory APK updates.

### Outstanding launch blockers

- Shared multi-tenant SaaS lacks tenant-scoped persistence, payment merchant binding, webhooks, background jobs and negative isolation tests.
- Fresh staging DB migration, real payment/refund reconciliation and end-to-end user/device UAT not yet certified.
- Remaining brand/asset references flagged by the scanner require correction and legal ownership checks.
- This repo is not proof of live deployment health or user-facing quality; record screenshots, API traces and UAT approvals before customer signoff.
