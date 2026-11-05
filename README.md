# PlayNexa

**White-label sports arena operations + consumer sports marketplace, by Varada Techworks.**

Source product to be generalised: [Jnapanam Sports Zone](https://github.com/bv-prasanna/jnapanam-sports-zone). **Jnapanam's existing production repo and deployment are not changed by this workspace.**

## Three sales experiences, one arena engine

1. **Dedicated / independently deployed arena:** each customer owns their deployment, DB, domain, merchant details and branded experience.
2. **White-label SaaS arena:** tenant-specific brand, users, courts, pricing and payments on a shared platform. Secure database tenancy is **planned, not yet enabled**.
3. **PlayNexa marketplace:** optional discovery/listing for dedicated or SaaS arenas. Booking and payment must go to one authoritative arena service, not duplicate inventory.

Marketplace participation is **independent** of hosting: an arena can be dedicated and also listed in PlayNexa.

## Try the interactive demo

Requires Node.js 20 or later; no dependencies and no installs:

```bash
npm run demo
```

Open **http://127.0.0.1:8080**.

- [Marketplace](demo/marketplace.html) — browse and search synthetic arenas across cities and sports.
- [Branded arena](demo/arena.html) — switch between arena identities/themes and see sports.
- [New arena setup](demo/onboard.html) — configure a new brand in the browser and immediately view its demo listing.

The demo is local-only and uses synthetic data and browser localStorage. It does **not** create real bookings, process payments, verify domains or provision infrastructure.

## Create a deployable configuration draft

```bash
npm run arena:new -- --name "Victory Sports Arena" --city Bengaluru --sports "Badminton,Football" --mode dedicated --marketplace
npm run arena:new -- --name "Metro Swim" --city Mysuru --sports "Swimming" --mode saas
```

This creates a draft under `config/tenants/`. To change the arena's presentation, edit the configuration; do not change business source code. Provisioning, payment integration and backend binding are still to be implemented.

## Verification

```bash
npm test
```

Tests cover deployment mode setup, brand and domain inputs, published directory listing, public-data minimisation, host-to-tenant resolution and negative cross-tenant guard cases.

## Architecture & delivery

- `packages/platform-core/index.mjs`: configuration, discovery, host resolution and tenant context contracts.
- `demo/`: interactive stand-alone demo for pitches (no external paid services).
- `scripts/`: demo web server and arena configuration CLI.
- [Deployment and onboarding design](docs/DEPLOYMENT_AND_ONBOARDING.md)
- [Source code migration map](docs/JNAPANAM_PORTING.md)
- [Productisation roadmap](docs/ROADMAP.md)

### Current limitation

This is a **productisation foundation and sales demo**, **not** a completed Jnapanam source migration. Its pages and JS contracts are not yet wired into the production Jnapanam Spring Boot, web or Android implementation. Dedicated deployments still need a full import/refactor; SaaS additionally requires tenant-aware schema, queries, authentication and isolation tests; the marketplace needs an authoritative booking integration before taking live payments.

Do not commit production secrets or copy real customer data into demo profiles.
