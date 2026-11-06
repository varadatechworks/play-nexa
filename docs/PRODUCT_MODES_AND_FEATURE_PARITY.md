# PlayNexa product contract — customer choice, full booking, marketplace later

## Confirmed product decision

PlayNexa is **sports arena booking software first**. Venue owners buy a way for customers
to reserve slots and pay online, as well as a complete operations and administration
platform. No customer should need to maintain servers unless they explicitly choose to.

### All three hosting choices ship the same product

| Customer-selected arrangement | Runs infrastructure | Database ownership/isolation | Who handles maintenance | Arena experience |
|---|---|---|---|---|
| Customer-hosted | Arena / its IT vendor | Customer-operated, dedicated database | Customer (with agreed support from Varada) | Arena's website/brand |
| PlayNexa-managed, single-tenant | Varada Techworks | Dedicated database and deployment per arena | Varada Techworks | Arena's website/brand |
| Multi-tenant SaaS | Varada Techworks | Shared infrastructure, **strict isolated tenant data** | Varada Techworks | Arena's domain/subdomain, website/brand |

These are **deployment choices, not subscription feature tiers**. Every choice has the
same capabilities. A badminton-only venue may hide swimming, a venue without a shop
may hide shop navigation, etc. The customer never loses booking, payment, refunds,
tax, billing or operations because of hosting choice.

### Feature parity across all three arrangements

The Jnapanam-derived implementation exposes modules for the following areas.
All must be carried forward and regression-verified on **each** release channel.
Existing source modules are not proof every end-to-end workflow is production-ready.

| Capability group | Customer-hosted | Managed single-tenant | Multi-tenant SaaS |
|---|:---:|:---:|:---:|
| Sports, facilities/courts, capacity and schedules | ✓ | ✓ | ✓ |
| Public sports discovery at the **arena's own website** | ✓ | ✓ | ✓ |
| Live availability, slot holds, online bookings and calendar | ✓ | ✓ | ✓ |
| Payments, verification, reconciliation and failures | ✓ | ✓ | ✓ |
| Cancellation, partial/full refunds, no-show admin refund controls | ✓ | ✓ | ✓ |
| Memberships, recurring subscriptions, coaching and camps | ✓ | ✓ | ✓ |
| Tournaments, teams and organisers | ✓ | ✓ | ✓ |
| Dynamic pricing, peak/off-peak, coupons and promotions | ✓ | ✓ | ✓ |
| GST/tax rules, invoices, receipts and credit notes | ✓ | ✓ | ✓ |
| Customer profiles, login, OTP/MFA and role-based access | ✓ | ✓ | ✓ |
| Admin, operator, staff scheduling, check-in, QR | ✓ | ✓ | ✓ |
| Shop, inventory and counter sales (when enabled) | ✓ | ✓ | ✓ |
| Loyalty, notifications, reporting, audit and error logs | ✓ | ✓ | ✓ |
| Responsive web + Android option, English/Kannada | ✓ | ✓ | ✓ |
| Independent arena branding and payment merchant configuration | ✓ | ✓ | ✓ |

✓ means **required product entitlement**. It is NOT a claim of completed live
SaaS implementation or validated deployment. The suite must prove a booking can
be held, paid, confirmed, cancelled/refunded and invoiced without double booking.

No marketplace inclusion is required, and no PlayNexa marketplace commission is
automatically attached to a SaaS subscription.

## Architecture

Use one booking/checkout codebase, with two kinds of data isolation:

1. **Dedicated** for both customer-hosted and PlayNexa-managed single-tenant.
   Same build/version/config contract, separate DB, secrets, merchant, object
   storage, hostname, signing/config, backups and monitoring. Customer chooses
   the responsibility split, not the codebase.
2. **Shared SaaS**: same booking services, verified host → tenant, tenant-bound
   tokens and roles, tenant IDs on every business record and foreign key, tenant
   scoped SQL/storage/cache/queue/notifications, merchant and webhook isolation.
   SQL row-level security plus application-level authorization and negative tests
   must protect cross-tenant data. All operations and analytics are tenant-aware.

The imported backend currently has a **fail-closed SaaS safety gate**. It must
remain enabled until all repository paths, async jobs, financial records,
webhooks, uploads and exports enforce isolation. Do not bypass the gate to
claim a faster SaaS launch.

## Fast onboarding in PlayNexa

1. Capture arena name, contact, geographic location, business details and preferred arrangement.
2. Set brand colours, logo, policies, domain, email/SMS sender and language options.
3. Configure sports → individual courts/facilities → operating windows →
   sessions/slots → capacity/booking rules and pricing.
4. Configure taxes, invoices, merchant settlement identity, refund/deduction
   policy, offers and coupons.
5. Set up owner/admin/operator/coach/shop roles and mobile access.
6. Run a **real sandbox booking**: quote → hold → payment → verification →
   reservation → invoice → check-in → cancellation/partial refund.
7. Verify DNS, privacy, backups, alerting, media rights, operational monitoring
   and negative tests; only then mark the arena published.

Dedicated instances can use the existing branding admin and config draft
generator. SaaS tenant creation must become an authenticated control-plane flow
with a transactionally safe tenancy bootstrap and automated isolation checks.

## Release gating for multi-tenant SaaS

- Verified tenant registry and DNS/domain ownership, with no client-provided
  tenant ID ever granting access.
- Tenant-aware identity and role assignment; JWT audience/issuer and claims,
  replay/refresh rules, and arena suspension.
- Tenant-scoped schemas/rows, compound foreign keys, RLS and test fixtures
  proving no cross-tenant access on bookings, admin, reports, payments, refunds.
- Per-tenant merchant secrets, secure webhook mapping and idempotency.
- Tenant-scoped background jobs, notifications, exports, storage and caches.
- Per-tenant tax/GST invoice identity, receipt numbering, refund records,
  pricing, offers, loyalty and business settings.
- Booking capacity/availability concurrency tests, online payment happy/failure
  path and partial refunds, English/Kannada, Android deep links.
- Backups, restores, health monitoring, service limits, tenant suspension,
  data migration and recovery tested.

The JS `launchReadiness(...)` function tracks **supplied evidence** only.
It does not run or prove backend tests and must not be used as a production
authorization decision by itself.

## Marketplace

**Deferred until the three hosting arrangements and booking engine are ready.**
Do not offer marketplace opt-in during new arena onboarding or advertise
cross-arena checkout as a currently available product. Preserve code behind a
future release boundary; it must not affect payments, discovery or fees today.

When revisited, explicit arena consent and a new business decision will be
required. No assumption that a SaaS subscriber also agrees to marketplace
bookings, commissions or promotion of competitors.

## Work status (7 November 2026)

- ✅ Imported Jnapanam backend/web/mobile source into PlayNexa, keeping live
  Jnapanam separate.
- ✅ Dedicated branding API/admin and build-time venue-specific mobile config.
- ✅ Three hosting arrangements now modelled in platform contracts, with full
  feature entitlements and mandatory booking/payments/refunds UAT checklist.
- ✅ Synthetic sales demo: arena branding and sample booking; **no live charge**.
- ⚠️ Dedicated go-live still requires end-to-end validation, clean database,
  merchant/KYC, DNS, signing and hardcoded-media audit.
- ❌ Fully isolated multi-tenant SaaS and automated tenant provisioning not
  implemented. Backend blocks shared hosting intentionally.
- ⏸ Marketplace deferred.
