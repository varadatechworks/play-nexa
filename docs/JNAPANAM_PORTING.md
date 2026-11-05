# Jnapanam → PlayNexa migration map

Source: `bv-prasanna/jnapanam-sports-zone` (reviewed on 6 November 2026). DO NOT change its production infrastructure during PlayNexa migration.

## Existing source baseline

- `apps/backend`: Java 21, Spring Boot 4.1.1, JPA/PostgreSQL, Flyway, payment/booking/membership/operations modules.
- `apps/web`: React 19 / Next 16 / Vinext, customer and admin experiences.
- `apps/mobile`: Expo Android app with Jnapanam-specific package, icon and deep-link scheme.
- Existing web `app/page.tsx` hardcodes Jnapanam, Holalkere, images and hero video.
- Existing web `app/layout.tsx` hardcodes metadata and favicon.
- Existing web `components/site-header.tsx` hardcodes Jnapanam home label/brand logo.
- Existing web `lib/site-data.ts` lists fixed sports.
- Existing mobile `app.json` hardcodes app name, `com.jnapanam.sportszone`, asset paths and scheme.
- Existing backend `application.yml` has instance-wide payment, data source, OTP, notification and bootstrap settings.

## Minimum integration increment

1. Import maintained source and preserve original tests. Ignore backups, compiled outputs, deployments/secrets and real customer data.
2. Introduce `ArenaSettings` backend model, repository, DTO and versioned migrations. For a dedicated deployment, one configured `arena_id` may be implicit internally but must be explicit in API and event contracts.
3. Add public `GET /api/v1/public/arena-branding` scoped from server-verified host. Only publish safe brand fields, sports/features/contact.
4. Add authenticated, platform-or-arena-authorised branding/config mutations with optimistic revision and change audit; never expose secrets.
5. Refactor web page, layout metadata, header, site data, about/contact/gallery, emails, PDF invoices, notifications, SMS and policies to read arena settings. Add no-cache/fallback behavior for unknown hosts.
6. App product variants: (A) common PlayNexa marketplace app using arena selection, (B) optionally separately branded Android builds with per-arena package/scheme/signing. Runtime theme is not sufficient to change Android package name or store icon.
7. Preserve existing booking, pricing, feature visibility, taxes, payment/refund, invoice, membership, tournaments and shop behavior. Add tenant-aware contract tests before shared mode.
8. Add dedicated deployment template with arena-specific DB, host, CORS, JWT issuer, OAuth/OTP config, merchant secrets and email sender.
9. Extend marketplace public index with verified arena listings. Keep payments and booking inventory with source arena.
10. Run regression, negative security, end-to-end and accessibility tests for both hosting modes, and check existing Jnapanam production independently.

## Gates

**Dedicated deployment gate:** brand settings integrated into web and backend; new empty arena DB; seed facilities; working checkout and UAT; no Jnapanam data/secrets.

**Shared SaaS gate:** strong tenant ID scoping for every database table/transaction (including scheduled jobs and webhook callbacks), login claims, RLS, tenant-owned foreign keys, cache/storage namespaces, backups, alerts; verified hostile-user tests.

**Marketplace gate:** publish consent, discoverability, attribution, authoritative booking handoff and no double charge. Central checkout is a separate gated feature.

## Not yet implemented

The PlayNexa repository currently contains a standalone platform contract, sample sales/demo pages and a local configuration generator, but not the actual imported Jnapanam booking backend, web frontend or Android application. No production tenant data isolation or checkout integration can be inferred from the demo.

## Intellectual property and licences

Before commercial redistribution, audit source dependencies, third-party assets, media, licences, the existing mobile app `LICENSE`, and sensitive configuration. Replacing the visible Jnapanam brand must not alter existing customers' contractual or data obligations.
