# PlayNexa delivery roadmap

## Product outcome

A new arena can choose **customer-hosted, PlayNexa-managed dedicated or multi-tenant SaaS**, and immediately receive the same complete sports **booking + payment + operations** product. Marketplace is postponed.

## Current baseline

- Jnapanam's Spring Boot/PostgreSQL backend, React web and Expo mobile source are imported in PlayNexa.
- Dedicated instance branding can be edited from the arena admin screen.
- Full product capability matrix, three hosting choices and go-live evidence contracts are defined; synthetic sales booking preview available.
- A shared SaaS safety filter blocks non-health API routes to avoid unsafe cross-tenant use.
- All underlying Jnapanam capabilities must be regression-tested; imported modules alone do not prove production readiness for a new customer.

## Track A: dedicated deployment for either infrastructure owner

1. Finish removal of Jnapanam-specific media, static text, PDF/notification templates, default icons, credentials, URLs and mobile links.
2. Build a reusable provisioning flow: choose `customer_hosted` or `playnexa_managed_single_tenant`; create isolated DB/service, domain/DNS, TLS, storage and secret-manager references.
3. Make branding, sports/facilities, schedules, taxes/pricing, merchant settings and operator setup configurable from admin UI.
4. Run full booking/payment/refund/invoice/notification/check-in UAT, security and concurrency tests for every newly provisioned arena.
5. Publish customer-specific Android builds only with unique signing/package/icon/deep-link scheme, or offer a safe universal app after API isolation.

## Track B: multi-tenant SaaS — in parallel and essential to launch

1. Create platform control plane for tenant lifecycle, verified host registry, organisation owner and arena staff memberships, signup and subscriptions.
2. Add `arena_id` and tenant-owned composite foreign keys to all business tables. Migrate existing isolated databases cautiously; no real Jnapanam data copied into SaaS.
3. Enforce tenant identity in Spring Security/JWT; deny unknown/suspended tenants; verify host mapping.
4. Scope **every** repository query, transaction, batch job, webhook, refund, cache, media, email, PDF, audit and export. Add PostgreSQL RLS as a second defence.
5. Tenant-owned Razorpay merchant settings and verified webhook mapping, tax identities, invoice numbering, payment/refund idempotency.
6. Implement same customer/admin/operator UX and optional venue branding/domain on shared hosting.
7. Run hostile cross-tenant tests, booking conflicts/race tests, end-to-end sandbox payment tests, restore drills and negative auth checks.
8. Remove the shared SaaS HTTP safety gate **only after** the above tests are complete and approved.

## Shared feature parity gate

Both tracks must meet the same [full Jnapanam feature matrix](PRODUCT_MODES_AND_FEATURE_PARITY.md):
booking slots/holds, checkout/payments, cancellation/partial refunds, memberships, coaching, tournaments, dynamic pricing, tax/GST, invoices, check-in/operations, notifications, commerce, loyalty, reporting, roles and mobile.

## Deferred: PlayNexa marketplace

No marketplace at launch. Do not integrate marketplace subscription fees, cross-arena booking, commission or automatic opt-in into tenant onboarding. Existing experimental directory code remains outside the launch path.

## Release verification

Use `npm test`, imported Spring Boot integration/security tests, web build, mobile type-check and an actual isolated staging Postgres + Razorpay sandbox. The pure-JS feature matrix is an entitlement contract, **not** a claim that all features pass UAT or that SaaS currently works.
