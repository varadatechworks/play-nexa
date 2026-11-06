# PlayNexa second-pass audit — 6 Nov 2026

## Aim
Reuse the imported Jnapanam booking application for individually deployed white-label arenas, for future tenant-isolated SaaS, and for an optional PlayNexa marketplace without risking any existing Jnapanam production data.

## Implemented in this review

| Area | Result | Scope |
|---|---|---|
| Dedicated arena branding | Implemented | New Flyway V60 single-instance branding table, read API and admin update API |
| Admin self-service | Implemented | `/admin/arena-branding` editor with live preview, validation and revision conflict handling |
| Live web branding | Implemented for core public screens | Header, homepage, sports cards, footer, contact, About and Android download page |
| Legacy founder material | Removed from generic home/About | Avoids attributing a customer's venue to the Jnapanam founder |
| Mobile brand identity | Partially improved | App name, city, colours and header are build-time configurable; no Jnapanam default launcher icon |
| Unsafe SaaS deployment | Blocked | Global request filter returns 503 when PLAYNEXA_HOSTING_MODE is not dedicated (except health checks) |
| Marketplace domain ownership | Improved contract only | Verified domains required for host lookup and authoritative checkout handoff |
| Onboarding scripts | Improved | Shared SaaS deployment environment output is refused; dedicated mobile options generated |
| Tests | Added | API fallback, persisted brand, revisions, unsafe URLs, cross-mode denial and domain guards |

## Dedicated arena onboarding checklist

1. Create an arena draft: `npm run arena:new -- --name "Victory Sports Arena" --city Bengaluru --sports "Badminton,Cricket" --mode dedicated --marketplace`.
2. Generate initial environment: `npm run arena:env -- config/tenants/victory-sports-arena.json`. It does **not** contain payment, database or signing secrets.
3. Provision separate database, backend service, web deployment, domains, email/SMS settings and app signing. Never reuse Jnapanam production data or keys.
4. Apply migrations; start backend with `PLAYNEXA_HOSTING_MODE=dedicated`.
5. Sign in as the dedicated arena admin and open `/admin/arena-branding` to configure identity, logo, colours, introductory text and sports.
6. Separately configure sports/courts, capacities, slot schedules, taxes/pricing, policies, merchant, notifications, users and roles in the imported admin modules.
7. For custom Android builds, explicitly supply a tenant-specific launcher icon, package ID, deep-link scheme and signing certificate. Until then, keep Android app publishing disabled.
8. Run end-to-end UAT (booking, payment, cancellation/refund, invoice, check-in, permissions and multilingual UI) before public launch.
9. Marketplace listing must be separately opted into; production publication and domain ownership verification are not yet automated.

## Not yet production ready

- **Shared SaaS:** no full tenant-scoped bookings, roles, transactions, price rules, notifications, jobs, media, webhooks or database row security. This mode is intentionally blocked by the API safety gate, not enabled.
- **Live marketplace booking:** no authoritative cross-arena slots/holds/checkout or commission/settlement mechanism. The marketplace is a synthetic discovery demo; the platform contracts will allow verified booking handoffs later.
- **Automated customer provisioning:** separate service/DB/DNS/SSL/merchant account provisioning and readiness orchestration still require implementation.
- **Dynamic SSR metadata:** the public browser title updates after branding fetch; search-engine HTML metadata still uses deployment-time config until a server-side brand resolver is integrated.
- **Full white-label polish:** sports imagery, static events/gallery/media, all admin/customer/operator copy, mobile translations, documents, SMS, invoices and payment receipts require a further asset/branding review. This branch removes primary visible Jnapanam content but must not be marketed as fully scrubbed.
- **Asset licensing and identity:** imported Jnapanam photos, icons and imagery must not be shipped with an unrelated customer's licensed instance. Use tenant-owned assets and pass a strict branding audit.
- **Release quality:** the imported Spring Boot regression suite, Android end-to-end QA, migrations against a fresh Postgres database and payment sandbox/live verification remain release gates. Targeted unit tests are not a substitute.

## Security decisions

- `PLAYNEXA_HOSTING_MODE` must equal `dedicated` until the booking system is genuinely multi-tenant. Any unknown/shared setting fails closed.
- The public branding API contains no merchant secrets or internal admin metadata.
- Only authenticated `ADMIN`/`SUPER_ADMIN` roles can update dedicated arena branding.
- Branding uses an optimistic `revision` field; stale overwrites return 409.
- A claimed domain is not trusted until platform-level ownership verification. The Java backend remains dedicated-only and does not use the JS marketplace host registry as a security layer.
- Marketplace bookings must be made by one authoritative arena booking system. Do not publish cached prices as real-time availability.

## Verification

`npm test` covers platform contracts.
`mvn -f apps/backend/pom.xml -Dtest=PublicArenaBrandingControllerTest,SharedHostingSafetyGateFilterTest test` checks branding and shared-host gate.
Run web build and Android TypeScript checks from the GitHub Actions workflows before merging.

**Status:** productisation foundation strengthened, dedicated branding admin implemented, SaaS and live marketplace still gated.
