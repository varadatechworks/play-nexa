# Jnapanam → PlayNexa application port

The source application was imported into PlayNexa (`apps/backend`, `apps/web`, `apps/mobile`) from pinned Jnapanam revision `31816d98`. The original Jnapanam production repository, database, payment accounts and deployments remain untouched.

## Full feature retention is mandatory

Every hosting choice must use the same core booking and operations engine. The baseline includes sports/facilities, schedules/slots, booking holds and confirmations, Razorpay payment verification, cancellation/refund, memberships/subscriptions, coaching/training, tournaments, pricing/discounts, taxes/GST/invoices, loyalty, shop inventory/counter, notifications, QR check-in, reporting, admin and customer mobile.

Do not substitute an operations-only SaaS product, disable booking for subscription plans or fork the booking engine for customer-hosted deployments. Venue-specific visibility settings can hide irrelevant sports or modules only at the owner's instruction.

## Current port state

- Imported booking source is available for single-tenant deployments.
- Dedicated arena branding can be edited through persisted admin UI and served to the web site.
- Android build-time arena name, icon, package and deep link are configurable.
- Some imported media, metadata, invoices, labels, operations copy and notifications still need complete white-label review.
- Multi-tenant SaaS has NOT been enabled. Existing shared-hosting gate returns HTTP 503 until full isolation is implemented.
- Production booking/payment/refund/invoice regression against a new arena, and fresh database migration testing, remain required.

## Next source changes

1. Remove remaining Jnapanam-specific brand/data artifacts and provide tenant-owned media.
2. Finish single-tenant deployment automation and admin onboarding from scratch.
3. Build platform control plane for SaaS domain ownership, tenant provisioning, organisation memberships, subscriptions and operations.
4. Introduce tenant context in all backend records: booking, slot, hold, payment, webhook, refund, invoice, notification, report, job, asset, commerce, auth and audit.
5. Add composite tenant foreign keys + PostgreSQL RLS, ensure tenant-aware Spring Security, repositories, background workers, caches and storage.
6. Prove cross-tenant non-access, booking concurrency safety and per-tenant merchant/tax isolation. Only then enable SaaS with the same features.
7. Keep PlayNexa marketplace outside the current launch scope.

[Three hosting arrangements and release gates](PRODUCT_MODES_AND_FEATURE_PARITY.md).
