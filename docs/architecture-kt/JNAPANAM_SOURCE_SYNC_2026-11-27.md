# Jnapanam-to-PlayNexa source sync review — 2026-11-27

## Source revision reviewed

Reviewed the latest Jnapanam mainline changes through 2026-11-27, including merged PR #91 and PRs #97–#112 plus #114. PR #102 was superseded by #104 and was not ported separately. Open PRs #113 and #116 are not ported yet. Merged #114 provides slot-level front-desk scope; merged #115 adds assigned-facility equipment inventory scope and is ported below. Jnapanam remains the reference product; PlayNexa keeps its own branding, hosting model, tenant control-plane and deployment configuration.

## Ported to PlayNexa in this branch

| Jnapanam source | Ported capability |
|---|---|
| #91 | Added the iOS `ios-uat` EAS/TestFlight build profile and PlayNexa-specific release runbook. The production iOS bundle ID is explicitly required; no Apple credentials, signed IPA or TestFlight upload are claimed. |
| #97 | Refund settlement counts processed retained deductions as settled value, preventing over-refunds; loyalty reversal occurs only when the full captured amount is returned to the customer. |
| #98 | Mobile bookings reload authoritative booking/payment status whenever the screen regains focus after hosted checkout. |
| #99 | Admin refund calculator subtracts processed customer refunds and processed retained charges separately. |
| #100 | Customer web/mobile receipts and GST billing views show refund history, refund-to-customer amounts, retained charges and the recorded deduction description. |
| #101 | Admin refunds are allowed for verified late captures linked to PAYMENT_EXPIRED bookings so the captured money can be reconciled/refunded without reviving the released slot. |
| #103 | Payment idempotency keys cannot be replayed with a different purpose, reference, coupon or loyalty-points request. |
| #104 | A second distinct captured Razorpay payment ID for an already-paid order is recorded as REVIEW_REQUIRED for manual reconciliation; the original payment remains linked and access is not fulfilled twice. |
| #105 | Shop cancellation is serialized with counter collection; paid/cancelled orders cannot be improperly cancelled, paid or returned; unsupported online Shop payment is rejected; cart and variant rows are locked during checkout. |
| #106 | Admin Shop order transitions are state-machine validated; paid orders cannot be cancelled; cancellation restores stock and redeemed loyalty; counter handover requires a paid READY_FOR_PICKUP order; Shop Counter exposes valid fulfilment actions. |
| #107 | Customer cancellation restores redeemed Shop loyalty points and lifetime-redeemed balance exactly once. |
| #108 | Training withdrawal invokes recurring-subscription cancellation once, removing a duplicate provider call. |
| #109 | Training and tournament registration sheets scroll within the viewport and remain usable with the keyboard open. |
| #110 | Added the responsive Promotions & Offers admin workspace for coupon/automatic offers, eligibility, limits, validity and discount configuration. |
| #111 | Venue self-check-in uses venue-local date/time, a pessimistic booking-number lock, and accepts only PAID or NOT_REQUIRED bookings. PlayNexa keeps configurable `ARENA_TIME_ZONE` (default Asia/Kolkata) and `ARENA_VENUE_CODE` (default PLAYNEXA) rather than copying Jnapanam's hard-coded venue identity. |
| #112 | Ported the self-check-in regression suite, adapted to PlayNexa booking references, including owner privacy, payment state, booking date and duplicate check-in guards. |
| #114 | Operator front-desk walk-ins are checked against the assigned slot's facility; emergency closure is checked against the assigned facility. Added service-level tests for slot and facility scope. |
| #115 | Equipment inventory reads are filtered to an operator's assigned facilities; writes require a selected assigned facility. Administrators retain global inventory access. Added controller regression tests. |

## Implementation notes

- Jnapanam's refund deduction migrations were V60/V61. PlayNexa already uses V60 for arena branding, V61 for counter-payment audit and V62 for the tenant control plane, so the equivalent PlayNexa schema changes are versioned as V63/V64. Existing migration history was not rewritten.
- The Promotions admin page calls the existing protected PlayNexa promotion API. The navigation entry is admin-only; the page independently checks ADMIN/SUPER_ADMIN access.
- Razorpay refund requests now use an idempotency reference and preserve an uncertain provider outcome as a reconciliation-required state. Do not retry an uncertain refund until Razorpay is checked.
- The admin payment console now distinguishes a refund to the customer from a retained charge; a retained charge is not represented as money returned to the customer.
- Jnapanam branding, domains, credentials, app identifiers and production environment values were not copied.
- Tenant membership role `OPERATOR` maps to PlayNexa's actual `ROLE_OPERATIONS`; `ORGANIZER` is also tenant-scoped so global JWT roles cannot grant organizer access across arenas.
- Operator assignment authorization checks ACTIVE tenant memberships when tenant context is present; global ADMIN cannot bypass facility scoping in another tenant. Platform SUPER_ADMIN remains the explicit platform-wide bypass.
- PlayNexa's marketplace remains deferred.

## Verification still required

- Run the full backend Maven test suite, web contract tests/build and Expo/mobile contract tests on the PlayNexa branch.
- Rehearse V63–V66 on a disposable PostgreSQL database before production migration.
- Run browser and Android UAT for payment/refund, Shop cancellation/returns, Promotions, training withdrawal, and tournament registration.
- Reconcile tenant-aware data-plane authorization and hostile cross-tenant tests before enabling shared SaaS. The tenant registry/control-plane schema alone is not a tenant isolation boundary.
- Complete customer-hosted and PlayNexa-managed single-tenant deployment rehearsals and prove feature parity.

## Tenant-isolation gate

Shared SaaS remains disabled. Before opening it, implement transaction-scoped tenant context, database-enforced row policies or equivalent tenant-boundary controls, composite tenant relationships, and hostile cross-tenant read/write/delete tests across every tenant-owned table and asynchronous path. PostgreSQL row-level security must be tested using the actual least-privileged application role; table owners and BYPASSRLS roles can bypass ordinary policies, and pooled connections require transaction-local tenant context. See the PostgreSQL [row security documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
