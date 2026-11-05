# PlayNexa: deployment, onboarding and distribution

## Product decision: TWO axes, THREE selling experiences

Hosting and discovery are orthogonal choices:

| Experience | Hosting | Directory | Arena branding | Data boundary |
|---|---|---|---|---|
| Branded independent deployment | Dedicated app + DB per customer | Optional | Custom domain, logo, colours, policies, optional dedicated mobile build | Physically separate database |
| White-label SaaS | Shared platform | Optional | Config per verified tenant domain | Tenant-scoped database access (NOT IMPLEMENTED YET) |
| PlayNexa marketplace | Either of the above | Enabled with arena consent | PlayNexa search, arena-owned venue page | Read-only published discovery index; bookings remain arena-owned |

Do not build three different booking systems. A venue can enable marketplace discovery while remaining on a dedicated deployment. The marketplace is a channel, not a second source of availability, payment or booking state.

## Fast onboarding: minimum viable arena

1. Owner creates an arena account and verifies email/mobile. Platform assigns unique immutable arena ID and proposes a slug.
2. Owner chooses **Dedicated** or **SaaS** hosting. Separately decides **List on PlayNexa marketplace** on/off.
3. Uploads logo/hero, selects colours, enters legal name, public brand, contacts, location, languages and policies.
4. Creates sports → facility/court → capacity → operating days → slots and booking rules. Provide a cloned starter template but no real data.
5. Adds base prices, peak/off-peak rates, offers, taxes, cancellation/refund policies and invoice/business details.
6. Invites arena admins, operators/coaches, configures roles and optional devices/QR check-in.
7. Connects arena-owned payment merchant and verifies keys/webhooks. Store secret references in secret manager, NEVER in branding JSON or client responses.
8. Chooses `arena.playnexa.in`-style hosted domain (subject to DNS ownership) or verifies a custom domain by challenge.
9. Complete end-to-end sandbox/UAT: OTP, slots, hold, payment, booking, check-in, cancel/refund, invoice, session handling, Kannada.
10. Publish independently. Marketplace listing requires separate opt-in; can be toggled later without moving bookings.

### Starting packs

- **Badminton arena:** 2–6 courts, 60-minute bookable slots, membership/coaching enabled.
- **Multi-sport arena:** football + cricket turf, peak/off-peak, large-capacity sessions.
- **Swimming:** per-session capacity, coaching, daily/weekly slot patterns.

Templates must seed *configuration only*. Demo profiles and customer data must never be copied into live customer environments.

## Operational architecture

### Dedicated hosting
- One deployment, DB, object-store partition, encryption secrets, domain, checkout merchant config per arena.
- Reuse an identical PlayNexa application version and common onboarding/config contract.
- Platform control plane stores **deployment metadata** and health status, not customer bookings.
- Synced marketplace discovery is opt-in via authenticated publisher. Slot availability remains in the dedicated instance.

### Shared SaaS
- Central platform control plane with **verified host→tenant mapping** and separate tenant admin RBAC.
- Every tenant-owned table, query, background job, event, export, PDF, email and cache key has tenant context.
- RLS and application-level checks, composite tenant foreign keys and negative integration tests are mandatory before enabling real customers.
- Each arena may still have its own domain, branding and Razorpay merchant configuration.
- Instance, DB and payments are shared technically only where appropriate; never mix settlement records.

### Marketplace
- Index and display public published arena metadata, sports, location, photos and verified features.
- Do not present static demo prices as live quotes or make availability claims from cached listing data.
- First release **handoff checkout**: PlayNexa discovery → canonical arena booking URL → authoritative hold/checkout/invoice.
- Later, add unified in-marketplace checkout only via tenant-authenticated quote/hold/commit APIs, idempotency keys, webhook state machine, attribution and settlement audit.
- Protect private tenants and unpublished arenas from indexing.

## Platform control plane (target schema)

```text
organization / account
 └── arena (immutable tenant ID, slug, status, hosting mode)
     ├── verified_domains (host UNIQUE, proof, certificate status)
     ├── branding_versions (logo, palettes, text, locales, timestamps)
     ├── arena_features (feature flags, plans/limits)
     ├── arena_staff (identity, role, membership)
     ├── deployment (mode, region, service endpoints, health)
     ├── marketplace_publication (opt-in, visibility, sync status)
     └── merchant_secret_ref (vault pointer only)
```

Sports, courts, slots, prices, bookings, invoices, memberships and refunds remain in the transaction engine with strict arena isolation.

## Commercial options (proposal, not implemented)

- Independent arena licence + setup/support (optional hosting ownership).
- SaaS subscription billed per arena / facility / usage tier.
- Marketplace listing fee or attributable booking commission if the commercial agreement permits.
- Do not assume that marketplace commissions can be deducted from a third-party arena's Razorpay merchant settlements without a compliant settlement design.

## Demo and current scope

`npm run demo` starts a **fully synthetic** local showcase:
- `/` or `/demo/marketplace.html`: consumer sports discovery/search
- `/demo/arena.html?arena=riverside`: branded arena preview
- `/demo/onboard.html`: browser-local sample arena creation and instant preview

`npm run arena:new -- --name "Northside Sports" --city Bengaluru --sports "Badminton,Football" --mode saas --marketplace` creates a **local JSON draft** in `config/tenants/`. It neither provisions infrastructure nor publishes a tenant.

This foundation is not a production booking service. The original Jnapanam web, backend and Android code must still be integrated.
