# PlayNexa system architecture and booking data flow

> Source-reviewed on 10 November 2026. Describes the imported Jnapanam application and the target SaaS model. A diagram is **not evidence of a deployed or UAT-certified system**.

## 1. Current implementation: modular monolith

```mermaid
flowchart TB
  Customer[Customer web browser] --> Web[Next.js / Vinext web]
  Operator[Arena admin / operator browser] --> Web
  Android[Expo Android app] --> API[Spring Boot 4.1.1 API - Java 21]
  Web --> API
  API --> Security[JWT authentication + role checks]
  Security --> Core[Sport / facility / slot / booking services]
  Security --> Financial[Pricing / payment / refund / GST billing]
  Security --> Operations[Check-in / memberships / coaching / tournaments / shop]
  Security --> Comms[Notifications / audit / reports]
  Core --> PG[(PostgreSQL + Flyway)]
  Financial --> PG
  Operations --> PG
  Comms --> PG
  Financial --> Payment[Razorpay or mock in non-production]
  Comms --> Providers[SMTP / SMS / WhatsApp adapters]
  Ops[Operators & support] --> Logs[Correlation ID / audit / error log views]
  API --> Logs
```

**Observed modules:** identity/security, catalog/facilities, booking/slot holds, pricing, payment/refund, billing/tax, commerce, memberships, training, tournaments, loyalty, notifications, administration, events/content, player growth and operations. See source folders `apps/backend/src/main/java/com/jnapanam/sportszone` and web `apps/web/app`.

## 2. Hosting options use one product

```mermaid
flowchart LR
  Control[PlayNexa product / CI / releases] --> Build[One application codebase]
  Build --> Customer[Customer-hosted dedicated deployment]
  Build --> Managed[Varada-managed single-tenant deployment]
  Build -. future, blocked .-> SaaS[Multi-tenant SaaS shared service]
  Customer --> DB1[(Customer-owned PostgreSQL)]
  Managed --> DB2[(Varada-managed tenant-specific PostgreSQL)]
  SaaS -. require tenant-scoped schema + RLS .-> DB3[(Shared PostgreSQL)]
  Customer --> Brand1[Arena-specific domain + branding]
  Managed --> Brand2[Arena-specific domain + branding]
  SaaS --> Brand3[Verified tenant domain + tenant branding]
```

Customer-hosted and PlayNexa-managed single-tenant use the **same complete booking/payment/operations product**, differing only in who hosts, backs up, monitors and maintains it. SaaS must preserve feature parity; it is **not enabled in the Java backend** until authenticated tenant isolation is implemented and tested.

## 3. Booking, payment and refund sequence

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer
  participant W as Web / Android
  participant B as Booking API
  participant D as PostgreSQL
  participant P as Payment provider
  participant A as Operator
  C->>W: Choose facility, day, slot, quantity
  W->>B: Request availability and authoritative price quote
  B->>D: Read capacity and pricing policy
  D-->>B: Capacity, taxes, price snapshot
  B-->>W: Quote and rules
  C->>W: Confirm booking
  W->>B: Create expiring hold (idempotency key)
  B->>D: Atomically reserve capacity
  D-->>B: Hold ID / expiry
  B-->>W: Payment order details
  W->>P: Checkout with arena merchant account
  P-->>W: Payment result
  P->>B: Signed webhook (can retry)
  B->>P: Verify signature + order + paid amount
  B->>D: Idempotent transition: hold to confirmed
  B-->>W: Booking state from server
  B->>D: Issue invoice / audit / notify
  A->>B: Check in / cancel / request refund
  B->>D: Verify booking status / refund policy / deductions
  B->>P: Idempotent refund initiation
  P-->>B: Refund event
  B->>D: Reconcile status and issue credit note
```

The sequence is the **required end-to-end contract**, not a claim that every event ordering has been verified in PlayNexa. Test success, failure, webhook-before-return, duplicate retries, hold expiry, cancellation and partial refund. Reconciliation must not infer booking success merely from a UI notification.

## 4. Trust boundaries

- All client input is untrusted: user/arena IDs, booking totals, availability, discount codes, device IDs and geolocation.
- Spring Security/JWT and role membership must protect each API. Arena host mapping alone is **not** tenant authorization.
- Database-level booking capacity constraints and versioned transitions prevent concurrent double booking.
- Webhooks require provider signatures, merchant/order/amount reconciliation and idempotency.
- OTP values, passwords, JWT, payment secrets, PAN, customer identity documents and request bodies **must not appear** in diagnostic logs.
- The current `SharedHostingSafetyGateFilter` returns HTTP 503 for non-health endpoints in SaaS mode. Do **not** bypass this check until every table, query, job, attachment, invoice and webhook is tenant-scoped.

## 5. Current versus target boundaries

| Domain | Source present | Dedicated deployment | Multi-tenant SaaS |
|---|---|---|---|
| Booking, courts, capacity | Yes, imported | Requires fresh customer UAT | Requires tenant isolation and UAT |
| Payment/refund | Yes, imported | Merchant/sandbox validation required | Tenant-merchant mapping and isolation not complete |
| GST/invoicing | Yes, imported | Registered legal identity required | Number sequence, taxes and documents must be tenant-scoped |
| Branding | Dedicated database row + admin UI | Available after migrations | Needs verified tenant settings store |
| Mobile | Expo source + build-time brand | New icon/package/signing and deep-link test | Universal app / tenant switching security not complete |
| Observability | Correlation + audit filter | Configure retention, alerts and support access | Must include trustworthy tenant context |
