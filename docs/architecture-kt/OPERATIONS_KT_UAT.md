# Operations, maintenance, UAT and KT/demonstration guide

> Audience: arena owner, super-admin, operations staff, support/on-call and customer handover. Last reviewed 10 November 2026. This guide is a **demonstration plan**, not UAT signoff.

## 1. Roles and responsibilities

| Responsibility | Customer-hosted | PlayNexa-managed single-tenant | Future SaaS |
|---|---|---|---|
| Arena setup and booking rules | Arena owner / admin | Arena owner / admin | Arena owner / admin |
| Database, infrastructure and backups | Arena/IT partner | Varada operations | Varada operations |
| Platform upgrades and security patches | Contract-defined, often arena IT | Varada operations | Varada operations |
| Payment merchant/KYC and refund policy | Arena merchant/operator | Arena merchant/operator | Arena merchant/operator |
| End-user booking/check-in/support | Arena staff | Arena staff | Arena staff |
| Release safety and cross-tenant isolation | Dedicated deployment | Dedicated deployment | Not yet released |

## 2. KT demo script (approximate 35–50-minute walkthrough; not a future delivery promise)

| Stage | Demo action | Evidence to capture |
|---|---|---|
| Login (5 min) | Customer signup/OTP, operator and admin MFA, logout, session expiry | Role-based nav, understandable status messages |
| Arena setup (5 min) | Update brand, choose sports, courts, capacity and multiple operating periods | Arena-specific website and form validation |
| Online booking (8 min) | Customer selects facility/date/slot, sees quote, holds capacity, pays in Razorpay sandbox | Hold expiry, booking number and payment-to-booking consistency |
| Finance (7 min) | Pricing, tax/GST, invoice, receipt, cancellation, deduction and partial refund/no-show workflow | Verified server records, refund status, invoice/credit note |
| Operations (5 min) | Operator view today/tomorrow, QR/check-in, no-show, staff and shop tasks | Check-in audit and correct counts |
| Growth (5 min) | Membership, coaching, tournaments, offers, customer notifications | Customer + admin state match |
| Platform (5 min) | Logging, error reference ID, reports, APK update, backup/restore drill plan | Support procedure and documented owner |

**Demo environment:** isolated UAT database and sandbox payment merchant. Synthetic user data only. Do not perform a live refund or payment merely to satisfy a demo, and do not copy Jnapanam customer data into PlayNexa.

## 3. Page-by-page UAT

Run `npm run audit:routes` to list every committed Next.js page and Expo screen. For **each** route, test:

1. Anonymous/authorized/wrong-role access.
2. Desktop 1440px, tablet ~768px, phone 360–390px, portrait, scroll/back behavior.
3. Loading, zero results, invalid input, 401, 403, 404, 409, 429 and 500/503 handling.
4. Successful create/update/delete/cancel flow reflected in dashboard and database.
5. No internal errors or payment gateway secrets in UI, logs or downloadable receipts.
6. Kannada/English text, accessible labels, focus, contrast and keyboard/touch actions.
7. API metadata, correlation and audit record for failures; no personally identifying data copied into URLs.

Core higher-risk flows should also be rehearsed in the native Expo build (booking/payment return, notification, login, QR check-in, admin/operator permissions and app updates). **Do not mark the project UAT-complete until this matrix has signed evidence for every route.**

## 4. Maintenance and incident response

- **Daily:** check backend/DB health, customer booking failures, payment webhook backlog, stuck holds, failed notifications, receipt/invoice consistency and operator status.
- **Weekly:** review audit/error logs for recurring 401/403/409/5xx, backup jobs, restoration evidence, orphan checkout orders, failed refunds, expiring SSL, APK adoption and support issues.
- **Monthly:** dependency/security patch review, role access reconciliation, storage growth, data-retention audit, billing/tax regression and capacity/load tests.

Incident severity:
- **P0** wrong arena data access, payment duplication or exposed credentials — stop affected traffic, revoke secrets, preserve evidence and notify responsible owner immediately.
- **P1** widespread bookings/payment/refunds unavailable — disable new checkout safely; monitor reconciliation and communicate a status.
- **P2** isolated screen/notification/report defect — log correlation ID, reproduce UAT, apply reviewed patch and regression test.

## 5. Known unfinished release blockers

- Shared SaaS has no complete tenant-aware persistence and payment isolation; its API is intentionally disabled.
- Remaining hardcoded Jnapanam assets/copy must be removed from all customer-branded screens and messages.
- Customer-specific mobile signing, QR, custom domain, payment gateway and notification sender require setup.
- Fresh PostgreSQL migration/restore, booking concurrency, real sandbox payment/partial refund and full device UAT have **not** been certified as passing.
- The static sales demo is NOT the actual booking engine. Confirm all successes from server records.

## 6. Handover package

Provide immutable release SHA, CI results, environment/topology sheet with secret **references only**, domains, backup/restore references, Flyway history, SDK/APK signing custody, UAT checklist and defects, finance/tax setup, monitoring contacts, incident escalation, log retention, maintenance calendar and role/user inventory. Share secret values only through an approved secret manager, not in KT slides, docs, emails or screenshots.

## 7. Release decision

No launch approval should be issued based solely on unit-test passes, imported source, static diagrams or synthetic demo screens. Production sign-off requires a successful dedicated/tenant-scoped booking → payment → invoice → check-in → refund flow, role and race-condition tests, tested recovery and reviewed operational handover.
