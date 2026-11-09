# Database ER diagrams — bookings, identity, payments, GST and commerce

> Extracted from the **committed baseline migration SQL**. Subsequent `ALTER TABLE` migrations may change the full physical schema. Treat this as a **logical ER**, verify actual constraints with `pg_dump --schema-only` and Flyway history. Never infer live schema or table counts from this page.

## Identity, facilities and booking inventory

```mermaid
erDiagram
  USERS {
    UUID id PK
    VARCHAR email UK
    VARCHAR mobile UK
    VARCHAR password_hash
    VARCHAR status
  }
  ROLES {
    BIGINT id PK
    VARCHAR name UK
  }
  USER_ROLES {
    UUID user_id PK,FK
    BIGINT role_id PK,FK
  }
  SPORTS {
    UUID id PK
    VARCHAR code UK
    VARCHAR name
    VARCHAR status
  }
  FACILITIES {
    UUID id PK
    UUID sport_id FK
    VARCHAR code UK
    VARCHAR name
    INTEGER capacity
    INTEGER slot_duration_minutes
  }
  FACILITY_OPERATING_HOURS {
    UUID id PK
    UUID facility_id FK
    VARCHAR day_of_week
    TIME open_time
    TIME close_time
  }
  BOOKING_SLOTS {
    UUID id PK
    UUID facility_id FK
    DATE slot_date
    TIME start_time
    INTEGER capacity
    INTEGER held_count
    INTEGER booked_count
    BIGINT version
  }
  BOOKING_HOLDS {
    UUID id PK
    UUID user_id FK
    UUID slot_id FK
    INTEGER quantity
    VARCHAR status
    TIMESTAMPTZ expires_at
  }
  BOOKINGS {
    UUID id PK
    UUID user_id FK
    UUID slot_id FK
    VARCHAR booking_number UK
    INTEGER quantity
    VARCHAR status
  }
  USERS ||--o{ USER_ROLES : assigned
  ROLES ||--o{ USER_ROLES : granted
  SPORTS ||--o{ FACILITIES : offered
  FACILITIES ||--o{ FACILITY_OPERATING_HOURS : schedules
  FACILITIES ||--o{ BOOKING_SLOTS : creates
  USERS ||--o{ BOOKING_HOLDS : requests
  BOOKING_SLOTS ||--o{ BOOKING_HOLDS : reserves
  USERS ||--o{ BOOKINGS : owns
  BOOKING_SLOTS ||--o{ BOOKINGS : confirms
```

**Source:** `V1__identity_schema.sql`, `V3__sports_facilities_schema.sql`, `V4__booking_schema.sql`. Booking capacity has a database check: `held_count + booked_count <= capacity`; unique slot key is `(facility_id, slot_date, start_time)`. These constraints supplement transactional locking/versioning and do not alone prove race-free booking.

## Payment, refund and invoicing

```mermaid
erDiagram
  USERS {
    UUID id PK
    VARCHAR email
  }
  PAYMENT_ORDERS {
    UUID id PK
    UUID user_id FK
    VARCHAR receipt_number UK
    UUID reference_id
    BIGINT amount_paise
    VARCHAR provider_order_id UK
    VARCHAR status
    VARCHAR idempotency_key
  }
  PAYMENT_REFUNDS {
    UUID id PK
    UUID payment_order_id FK
    VARCHAR provider_refund_id UK
    BIGINT amount_paise
    VARCHAR status
  }
  PAYMENT_WEBHOOK_EVENTS {
    UUID id PK
    VARCHAR provider_event_id UK
    VARCHAR event_type
    VARCHAR payload_hash
    VARCHAR status
  }
  VENUE_BILLING_PROFILE {
    SMALLINT id PK
    VARCHAR legal_name
    VARCHAR gstin
    VARCHAR registered_address
  }
  VENUE_BILLING_DOCUMENTS {
    UUID id PK
    UUID payment_order_id FK
    UUID refund_id FK
    VARCHAR kind
    VARCHAR state
    VARCHAR document_number UK
    JSONB document_data
  }
  USERS ||--o{ PAYMENT_ORDERS : pays
  PAYMENT_ORDERS ||--o{ PAYMENT_REFUNDS : refunded
  PAYMENT_ORDERS ||--o{ VENUE_BILLING_DOCUMENTS : invoiced
  PAYMENT_REFUNDS |o--o{ VENUE_BILLING_DOCUMENTS : credited
```

**Source:** `V7__payments_schema.sql`, `V49__billing_tax_documents.sql`. `PAYMENT_ORDERS.reference_id` is a polymorphic reference paired with purpose, **not a declared FK to bookings**. `PAYMENT_WEBHOOK_EVENTS` is deduplicated by provider event ID, rather than represented as an FK to a specific payment row in the original migration. Refund adjustments and tax snapshots are augmented by later migration files. Check actual schema before adding references.

## Commerce inventory and orders

```mermaid
erDiagram
  COMMERCE_CATEGORIES {
    UUID id PK
    VARCHAR code UK
  }
  COMMERCE_PRODUCTS {
    UUID id PK
    UUID category_id FK
    VARCHAR sku UK
  }
  COMMERCE_VARIANTS {
    UUID id PK
    UUID product_id FK
    VARCHAR sku UK
    BIGINT price_paise
    INTEGER stock_quantity
  }
  COMMERCE_CART_ITEMS {
    UUID id PK
    UUID user_id FK
    UUID variant_id FK
    INTEGER quantity
  }
  COMMERCE_ORDERS {
    UUID id PK
    UUID user_id FK
    VARCHAR order_number UK
    VARCHAR status
    BIGINT total_paise
  }
  COMMERCE_ORDER_ITEMS {
    UUID id PK
    UUID order_id FK
    UUID product_id
    UUID variant_id
    INTEGER quantity
  }
  COMMERCE_STOCK_MOVEMENTS {
    UUID id PK
    UUID variant_id FK
    INTEGER quantity_delta
  }
  COMMERCE_CATEGORIES ||--o{ COMMERCE_PRODUCTS : holds
  COMMERCE_PRODUCTS ||--o{ COMMERCE_VARIANTS : variants
  COMMERCE_VARIANTS ||--o{ COMMERCE_CART_ITEMS : carted
  COMMERCE_ORDERS ||--o{ COMMERCE_ORDER_ITEMS : consists
  COMMERCE_VARIANTS ||--o{ COMMERCE_STOCK_MOVEMENTS : adjusted
```

**Source:** `V20__commerce_schema.sql`. `commerce_order_items.product_id` and `variant_id` are snapshot identifiers in the baseline DDL, without explicit FK declarations. Do not draw undocumented FK constraints.

## Dedicated arena branding

```mermaid
erDiagram
  ARENA_BRANDING_SETTINGS {
    SMALLINT id PK
    VARCHAR name
    VARCHAR short_name
    VARCHAR city
    VARCHAR primary_color
    VARCHAR accent_color
    VARCHAR logo_url
    VARCHAR sports_csv
    BIGINT revision
    TIMESTAMPTZ updated_at
  }
```

**Source:** PlayNexa `V60__playnexa_arena_branding_settings.sql`. Single row `id=1`; **not** a multi-tenant branding table. Multi-tenant design must use an immutable `arena_id` plus ownership constraints instead of putting different arenas into this table.

## Multi-tenant target schema (NOT DEPLOYED)

```mermaid
erDiagram
  ARENAS {
    UUID id PK
    VARCHAR slug UK
    VARCHAR status
  }
  VERIFIED_ARENA_DOMAINS {
    UUID arena_id FK
    VARCHAR host UK
  }
  ARENA_USER_MEMBERSHIPS {
    UUID arena_id FK
    UUID user_id FK
    VARCHAR role
  }
  TENANT_BOOKING_SLOTS {
    UUID arena_id PK,FK
    UUID id PK
    UUID facility_id FK
  }
  TENANT_BOOKINGS {
    UUID arena_id PK,FK
    UUID id PK
    UUID slot_id FK
  }
  TENANT_PAYMENTS {
    UUID arena_id PK,FK
    UUID id PK
    UUID booking_id FK
  }
  ARENAS ||--o{ VERIFIED_ARENA_DOMAINS : owns
  ARENAS ||--o{ ARENA_USER_MEMBERSHIPS : grants
  ARENAS ||--o{ TENANT_BOOKING_SLOTS : isolates
  ARENAS ||--o{ TENANT_BOOKINGS : isolates
  ARENAS ||--o{ TENANT_PAYMENTS : isolates
```

Composite foreign keys must include `arena_id` for every tenant-owned relationship. PostgreSQL RLS, application-level scope, signed user membership and tenant-specific webhook/merchant mapping are required. **Do not apply this sketch directly as a production migration.** No complete multi-tenant SQL migration exists yet.

See [source SQL catalogue](SCHEMA_INDEX.md) for every committed Flyway migration.
