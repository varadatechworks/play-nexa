# PlayNexa — Sports Arena Booking & Management

**Varada Techworks product. Complete online bookings and venue operations, with customer-selected hosting.**

PlayNexa is built from the maintained Jnapanam Sports Zone application. The original Jnapanam production repository, database and deployment remain separate.

## Three arrangements, exactly the same core product

| Choice | Infrastructure and maintenance | Isolation / brand |
|---|---|---|
| **Customer-hosted** | Arena or its IT vendor | Dedicated database and custom arena brand |
| **PlayNexa-managed, single-tenant** | Varada Techworks | Dedicated database and custom arena brand |
| **Multi-tenant SaaS** | Varada Techworks | Shared infrastructure with strictly tenant-isolated arena data and custom brand |

**Hosting is not a feature tier.** All three include the same booking and management capabilities: real-time court/slot availability, capacity rules, online customer bookings, payments, cancellations, partial/full refunds, memberships, coaching, tournaments, promotions, dynamic pricing, tax/GST, invoicing, staff/QR check-in, shop, loyalty, notifications, analytics, audit logs and role-based web/mobile access. Arenas can hide modules not relevant to their services, not lose entitlements.

The imported single-tenant backend implements the Jnapanam booking engine. **Shared SaaS is NOT yet production enabled**, because cross-tenant database, payment, authentication and background-job isolation is still being implemented. Its API currently fails closed in shared mode.

**Marketplace is postponed.** It is not part of PlayNexa's present sales, onboarding, payments or customer subscriptions.

See the [product contract and full feature matrix](docs/PRODUCT_MODES_AND_FEATURE_PARITY.md).

## Try a sales demo

Requires Node.js 20+, no paid services or dependencies for this demo:

```bash
npm run demo
```

Open **http://127.0.0.1:8080** to choose a branded arena, view its sports and create a **synthetic sample booking**. Use `/demo/onboard.html` to create a browser-local arena profile and choose one of the three hosting arrangements.

**Warning:** Demo bookings are not live reservations. No payment, inventory hold, invoice, refund or external notification occurs in the static demo.

## Prepare a real arena onboarding draft

```bash
npm run arena:new -- --name "Victory Sports Arena" --city Bengaluru --sports "Badminton,Football" --deployment customer_hosted
npm run arena:new -- --name "Northside Sports" --city Mysuru --sports "Swimming,Cricket" --deployment playnexa_managed_single_tenant
npm run arena:new -- --name "Urban Sports" --city Bengaluru --sports "Badminton" --deployment multi_tenant_saas
```

Each command generates a **draft only** under `config/tenants/`, including identical full feature entitlements and no marketplace listing. It does **not** create an account, deploy a backend, create live booking slots, verify DNS or take payment.

For either dedicated arrangement, render non-secret deployment environment examples:

```bash
npm run arena:env -- config/tenants/victory-sports-arena.json
```

Shared SaaS environment generation remains intentionally blocked until tenant isolation is tested. On a running dedicated deployment the arena admin can edit its branding in **/admin/arena-branding**.

## Testing

```bash
npm test
npm run branding:audit
npm run audit:routes
bash scripts/migrate-playnexa.sh plan
```

The audit reports remaining Jnapanam-specific references, images, app links and other content that must be cleaned before commercial white-label release.

## Source modules

- `apps/backend`: imported Java 21 / Spring Boot / PostgreSQL booking, commerce, admin, finance, roles and operations engine
- `apps/web`: responsive customer and admin website
- `apps/mobile`: Expo/Android app
- `packages/platform-core`: arena configuration, three deployment choices, full entitlements and evidence-based release checklist
- `demo`: browser-only, synthetic sales preview
- `scripts`: local draft generation, dedicated environment output and white-label audit

**Next development gates:** complete multi-tenant isolation on the full imported Jnapanam modules, provision per-arena environments/merchant settings, audit legacy-brand assets, and perform booking/payment/refund/invoice UAT. Do not enable SaaS by bypassing the safety filter.

[Three-mode product contract](docs/PRODUCT_MODES_AND_FEATURE_PARITY.md) · [Detailed onboarding plan](docs/DEPLOYMENT_AND_ONBOARDING.md) · [Roadmap](docs/ROADMAP.md)

## Architecture, ER, migration, maintenance and KT package

The source-reviewed [PlayNexa technical handover](docs/architecture-kt/README.md) includes:
[system architecture](docs/architecture-kt/SYSTEM_ARCHITECTURE.md),
[deployment diagrams for all three hosting choices](docs/architecture-kt/DEPLOYMENT_TOPOLOGIES.md),
[booking and payment ER diagrams](docs/architecture-kt/ER_BOOKING_PAYMENTS.md),
[full SQL migration catalogue](docs/architecture-kt/SCHEMA_INDEX.md),
[guarded Flyway migration procedure](docs/architecture-kt/MIGRATION_RUNBOOK.md),
[API status/log and security standards](docs/architecture-kt/STATUS_LOGS_SECURITY.md),
[page-by-page web/mobile route inventory](docs/architecture-kt/SCREEN_ROUTE_INVENTORY.md)
and [maintenance/UAT/KT guidance](docs/architecture-kt/OPERATIONS_KT_UAT.md).

The Node static audit inventories customer/admin/mobile source files; **it does not claim every route has passed visual or role-based browser/device UAT**. The imported full-featured booking system still requires a real staging database, sandbox payments/refunds, operator workflows and cross-tenant isolation before selling multi-tenant SaaS.

Production setup requires `APP_ENV=production` (or an active Spring production profile), complete per-arena secret configuration and a production HTTPS API origin. Dedicated customer-hosted and PlayNexa-managed single-tenant instances retain full feature parity.

## 2026-11-10 UI, audit and technical handover updates

A [second-pass source inspection](docs/architecture-kt/SOURCE_REVIEW_2026-11-10.md) covers all **39 web pages and 20 Expo mobile screens** at source level. Corrected false MFA prompts, safe 4xx/5xx classification, spoof-resistant audit metadata, an explicit production dedicated-mode gate, venue-branded welcome notifications, and packaging metadata. Added [extended ER models](docs/architecture-kt/ER_EXTENDED_MODULES.md) plus a [read-only schema exporter](scripts/schema-export-playnexa.sh). These commits do **not** certify browser UAT, PostgreSQL migration execution, live gateway reconciliation, shared SaaS or marketplace availability.
