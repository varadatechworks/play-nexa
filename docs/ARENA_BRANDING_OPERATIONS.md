# Rebrand a dedicated arena from one config

The imported Jnapanam application is now present under `apps/backend`, `apps/web` and `apps/mobile` on the PlayNexa feature branch.

## Current dedicated mode (first integration increment)

The backend exposes `GET /api/v1/public/arena-branding`, populated only by deployment-controlled `ARENA_*` environment settings. It explicitly rejects `PLAYNEXA_HOSTING_MODE=saas` until host/tenant isolation is implemented.

The homepage, document metadata, header, contact and sports catalogue now support build-time `NEXT_PUBLIC_ARENA_*` settings. Web and backend need to receive matching values (an upcoming runtime API adapter removes this duplication). Branding elsewhere in web/mobile/backend remains to be audited before any customer production launch.

Android `apps/mobile/app.config.js` supports brand-specific app name, bundle/package identifier, launcher/splash image and deep-link scheme. Production build guard `PLAYNEXA_BRANDED_RELEASE=true` requires arena-specific icon, package and scheme. Runtime branding alone cannot change the installed app identifier.

## Arena example

```bash
npm run arena:new -- --name "Victory Sports Arena" --city Bengaluru --sports "Badminton,Swimming" --mode dedicated --marketplace
npm run arena:env -- config/tenants/victory-sports-arena.json
```

The second command prints non-secret backend/web/mobile settings. Copy to the matching hosting platform after reviewing. It **does not deploy**, provision a DB, verify a domain, sign an APK or configure payment webhooks.

### Required per-arena deployment inputs
- Own database, backend URL and frontend domain (with DNS/SSL verification)
- Auth/JWT secrets and expiry/OTP settings
- Merchant ID and webhook verification secret in secret storage
- Email/SMS provider and business documents
- Logo/hero image and app launcher icon with usage rights
- Appropriate taxes, pricing, booking rules, refund/cancellation settings
- CI-tested Android package and deep-link configuration, versioning, signing
- Admin onboarding/UAT and marketplace publication consent

### Multi-tenant SaaS (not ready yet)
Never run real tenants through this dedicated-mode public branding endpoint with only a hostname parameter. SaaS requires explicit tenant records, verified domain ownership, tenant-bound auth, database constraints, row-level isolation and negative tests. The marketplace directory is not permission to access an arena's private records.

## Next integration changes
1. Build authenticated platform/arena-admin CRUD UI and persisted branding versions, rather than manual environment config.
2. Resolve settings from backend using a verified domain, not query string or mutable user-supplied headers.
3. Replace residual Jnapanam brand from all customer and operator pages, legal copy, invoices, emails, SMS and mobile UI.
4. Wire marketplace listing into authoritative arena discovery, availability and booking APIs.
5. Add two pipelines: lightweight shared SaaS deploy, and generated dedicated-arena deploy; keep production data separate.
