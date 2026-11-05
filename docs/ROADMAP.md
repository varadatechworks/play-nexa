# PlayNexa productisation roadmap

## Origin and baseline
Jnapanam source: `bv-prasanna/jnapanam-sports-zone` (Spring Boot / PostgreSQL backend, React / Vinext web application, Android build). Copying code is not the same as secure multi-tenancy. Preserve existing Jnapanam deployment and its payment data.

## Phase 1: reliable dedicated-arena deployments
1. Import the maintained Jnapanam application into this repository after reviewing current main and excluding build outputs, secrets, backup directories and deployment-specific data.
2. Replace hardcoded Jnapanam text and media with a server-managed arena settings contract. Include editable logo, favicon, arena name, accent colours, hero, description, languages, business contacts, legal and policy links.
3. Configure domain, app package name, deep links, API base URL and Android signing separately per deployment.
4. Add admin onboarding wizard: identity → branding → facilities/sports → slots/capacity → pricing/taxes → Razorpay → operators → review/publish.
5. Retain configurable pricing, booking, operations, membership, training, tournaments, refunds, billing and checkout with regression tests.
6. Make deployment templates for preview/staging/live. Each dedicated arena uses separate database and credentials.

## Phase 2: sales demonstration
- Add a `DEMO_MODE` instance with 3 clearly fake arena profiles and realistic sports and slots.
- Seed synthetic customers, bookings, payments and dashboard figures; allow safe one-click reset.
- Disable actual OTP/SMS/email, payment capture, refunds and real notifications.
- Permit switching arena brand only within demo; production branding must be authenticated and authorised.
- Provide demo-ready customer, arena admin and operator flows.

## Phase 3: multi-tenant SaaS (separately gated)
- Introduce explicit tenant ID in all tenant-owned DB tables, foreign keys and unique constraints, audit logs and background jobs.
- Resolve tenant from verified host-to-tenant registry, authenticate membership, enforce tenant scoping at service/repository layers; deny cross-tenant access.
- Add tenant-scoped storage, encryption/secrets, quotas, payment webhooks and rate limits.
- Run negative isolation tests, privilege escalation tests, property-based scoping tests and backup/restore exercises.
- Add platform billing/subscriptions and a tenant lifecycle (trial, active, suspended) only after the isolation gate passes.

## Initial findings from source review
- Backend: Spring Boot 4.1.1, Java 21; PostgreSQL/Flyway; Maven JaCoCo.
- Web: React 19 / Next 16 / Vinext; current homepage hardcodes Jnapanam name, Holalkere copy, hero video and imagery.
- Current PlayNexa workspace does not yet contain migrated backend/web/mobile source. CI and E2E cannot be claimed to pass until porting and validation.

## Acceptance criteria
- A new arena can be branded, configured, deployed and demonstrated without editing application source.
- No Jnapanam records, Razorpay secrets or production JWT keys appear in demos.
- Existing Jnapanam deployment unchanged.
- Test booking, cancellation, invoice, refund, operator check-in and customer login per arena, in both English and Kannada.
- For multi-tenancy, assert zero cross-tenant access before any shared production deployment.
