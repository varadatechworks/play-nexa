# PlayNexa customer onboarding and deployment

**Current scope: full-featured arena booking and operations. No marketplace at launch.**

The customer chooses one of three arrangements:

| Deployment option | Infrastructure owner | Maintenance owner | Booking engine | Branding |
|---|---|---|---|---|
| `customer_hosted` | Arena | Arena or agreed vendor | Complete Jnapanam-derived engine | Arena |
| `playnexa_managed_single_tenant` | Varada Techworks | Varada Techworks | Complete engine | Arena |
| `multi_tenant_saas` | Varada Techworks | Varada Techworks | Same complete engine, once security-gated | Each arena |

A managed single-tenant customer's database and secrets must remain separate; the customer should not need to manage any servers.
The shared SaaS infrastructure uses one product codebase but requires tenant-aware storage, payments and admin.

## Onboarding wizard — required flows

1. **Arena identity:** registered legal name, display name, owner contact, address/GPS, GST/tax identity, currency and timezone.
2. **Customer hosting choice:** arena-hosted / PlayNexa-managed dedicated / multi-tenant SaaS, without changing feature entitlements.
3. **Branding:** logo, hero, colours, website/domain, English/Kannada, contact information, legal policies and privacy.
4. **Facility inventory:** sports, sites, courts, capacity and facilities, opening days/hours, schedule periods, holidays and closures.
5. **Customer online booking:** published live slots, hold/expiry, dynamic quotes, quantity/capacity control, conflict prevention, booking details and history.
6. **Revenue and billing:** base prices, peak/off-peak, offers, coupons, taxes, GST invoice/credit note, receipts, loyalty, subscriptions, shop.
7. **Merchant and refunds:** arena-owned Razorpay merchant, verified checkout/webhooks, partial/full refund controls, deduction reason, audit and reconciliation.
8. **People and operations:** customer accounts, MFA/OTP, operator, coach, shopkeeper, arena admin, check-in, QR, notifications, daily operation dashboard.
9. **Commerce and programs:** memberships, training camps, tournaments, organisers, inventory/counter sales, where enabled by the arena.
10. **UAT and publish:** test payment→booking→invoice→check-in→cancellation/refund, negative cases, roles, language, support and data backups.

Full product capability is in `packages/platform-core/deployment.mjs`. All hosting options produce the same entitlements. An operator may disable an irrelevant venue module without removing the underlying entitlement.

## Dedicated — customer-hosted or PlayNexa-managed

Both run **one arena per database**, with separate hosting configuration, domain, credentials, merchant, storage, logs and backup.
The only difference is who operates the infrastructure and who pays.
The dedicated environment generator can produce non-secret settings; it cannot deploy or verify UAT.

## Shared multi-tenant SaaS — required implementation

- A separately authenticated **platform control plane** provisions tenant ID, verified domains, membership, role bindings, branding and merchant secret references.
- One booking engine services all tenants; enforce `arena_id` on every slot, booking, hold, payment, refund, tax, invoice, notification, membership, shop order, audit log, attachment and scheduled task.
- Verify arena membership from signed identity and registered domain. Client-supplied arena IDs are selectors only, not authority.
- Use PostgreSQL RLS plus application-side scoping and tenant-specific foreign keys; test every cross-tenant read/write/export.
- Tenant-specific merchant routing, signed webhooks, idempotent payment capture/refunds, separate invoice numbers and tax identity.
- Tenant-scoped cache, file storage, reports, notifications, email/SMS senders, recurring jobs, backup/restore and data deletion.
- Test all Jnapanam booking and operational features before shared release, including malicious cross-tenant API requests.

**State:** the Java backend currently returns 503 outside dedicated hosting. Leave this safety gate intact until the real shared SaaS implementation and negative tests are complete.

## Marketing and billing

Each customer buys a complete booking + management package, not a maintenance-only service.
Subscription/service pricing can differ based on hosting costs and support SLA, but not by withholding core booking or payments. Payment gateway and messaging charges should be disclosed separately.

**Marketplace:** deferred. No automatic marketplace listings, new booking commissions or forced participation. Revisit only after the three hosting options operate reliably.

## Current demo

`npm run demo` opens an arena-branded **booking sample**. The local simulation neither holds live slots nor captures payment. To work with real bookings, use and test the imported `apps/backend`, `apps/web` and `apps/mobile` applications with their own isolated test database and sandbox merchant.

[Feature parity and release evidence checklist](PRODUCT_MODES_AND_FEATURE_PARITY.md).
