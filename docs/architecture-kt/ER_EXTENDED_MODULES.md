# PlayNexa extended entity-relationship models — memberships, coaching, tournaments, loyalty and audit

> **Source-derived on 2026-11-10.** Relationships below come from versioned Flyway SQL, not a live `pg_dump`; later migrations can add columns or constraints. These are logical ER diagrams, not executable database scripts. Shared SaaS remains prohibited until tenant scoping is complete.

See the [core booking/payment/tax/commerce ER](ER_BOOKING_PAYMENTS.md), [full migration catalogue](SCHEMA_INDEX.md), and [migration runbook](MIGRATION_RUNBOOK.md).

## 1. Membership and coaching

From `V5__membership_schema.sql` and `V6__training_coaching_schema.sql`.

```mermaid
erDiagram
  USERS {
    UUID id PK
  }
  SPORTS {
    UUID id PK
  }
  FACILITIES {
    UUID id PK
  }
  MEMBERSHIP_PLANS {
    UUID id PK
    VARCHAR code UK
    NUMERIC price
    INT duration_days
    VARCHAR status
  }
  MEMBERSHIP_PLAN_SPORTS {
    UUID plan_id PK,FK
    UUID sport_id PK,FK
  }
  CUSTOMER_MEMBERSHIPS {
    UUID id PK
    UUID user_id FK
    UUID plan_id FK
    DATE start_date
    DATE end_date
    VARCHAR status
  }
  TRAINING_PROGRAMS {
    UUID id PK
    UUID sport_id FK
    VARCHAR code UK
    VARCHAR status
  }
  TRAINING_BATCHES {
    UUID id PK
    UUID program_id FK
    UUID facility_id FK
    UUID coach_user_id FK
    INT capacity
    NUMERIC fee
  }
  TRAINING_ENROLLMENTS {
    UUID id PK
    UUID batch_id FK
    UUID user_id FK
    VARCHAR status
  }
  TRAINING_ATTENDANCE {
    UUID id PK
    UUID enrollment_id FK
    DATE session_date
    BOOLEAN present
  }
  MEMBERSHIP_PLANS ||--o{ MEMBERSHIP_PLAN_SPORTS : offers
  SPORTS ||--o{ MEMBERSHIP_PLAN_SPORTS : eligible_for
  USERS ||--o{ CUSTOMER_MEMBERSHIPS : subscribes
  MEMBERSHIP_PLANS ||--o{ CUSTOMER_MEMBERSHIPS : selected
  SPORTS ||--o{ TRAINING_PROGRAMS : includes
  TRAINING_PROGRAMS ||--o{ TRAINING_BATCHES : schedules
  FACILITIES ||--o{ TRAINING_BATCHES : hosted_at
  USERS |o--o{ TRAINING_BATCHES : coaches
  USERS ||--o{ TRAINING_ENROLLMENTS : attends
  TRAINING_BATCHES ||--o{ TRAINING_ENROLLMENTS : enrollments
  TRAINING_ENROLLMENTS ||--o{ TRAINING_ATTENDANCE : sessions
```

**Important constraints:** membership plan duration > 0; training batch capacity > 0; training batch end date must not precede start date; one enrollment per batch/user; one attendance row per enrollment/session date. Verify updated policies and refund/accounting in the current application before relying on baseline constraints alone.

## 2. Tournaments and fixtures

From `V9__tournaments_schema.sql`.

```mermaid
erDiagram
  USERS {
    UUID id PK
  }
  SPORTS {
    UUID id PK
  }
  FACILITIES {
    UUID id PK
  }
  ORGANIZER_APPLICATIONS {
    UUID id PK
    UUID user_id FK
    VARCHAR status
  }
  TOURNAMENTS {
    UUID id PK
    UUID sport_id FK
    UUID organizer_user_id FK
    VARCHAR code UK
    VARCHAR status
  }
  TOURNAMENT_TEAMS {
    UUID id PK
    UUID tournament_id FK
    UUID captain_user_id FK
    VARCHAR name
  }
  TOURNAMENT_TEAM_MEMBERS {
    UUID id PK
    UUID team_id FK
    VARCHAR name
  }
  TOURNAMENT_FIXTURES {
    UUID id PK
    UUID tournament_id FK
    UUID home_team_id FK
    UUID away_team_id FK
    UUID winner_team_id FK
    UUID facility_id FK
    TIMESTAMPTZ scheduled_at
  }
  USERS ||--o{ ORGANIZER_APPLICATIONS : requests
  USERS ||--o{ TOURNAMENTS : organizes
  SPORTS ||--o{ TOURNAMENTS : hosts
  TOURNAMENTS ||--o{ TOURNAMENT_TEAMS : registers
  USERS ||--o{ TOURNAMENT_TEAMS : captains
  TOURNAMENT_TEAMS ||--o{ TOURNAMENT_TEAM_MEMBERS : comprises
  TOURNAMENTS ||--o{ TOURNAMENT_FIXTURES : schedules
  TOURNAMENT_TEAMS ||--o{ TOURNAMENT_FIXTURES : home_team
  TOURNAMENT_TEAMS |o--o{ TOURNAMENT_FIXTURES : away_team
  FACILITIES |o--o{ TOURNAMENT_FIXTURES : uses
```

**Important constraints:** one team name and captain per tournament; unique round/match number; nullable away team (bye), winner, and facility. Baseline foreign keys do **not** automatically prove that a fixture's team belongs to the same tournament; validate such cross-entity invariants in services and negative tests.

## 3. Promotions, loyalty and payment linkage

From `V16__promotions_and_loyalty.sql`.

```mermaid
erDiagram
  USERS {
    UUID id PK
  }
  PAYMENT_ORDERS {
    UUID id PK
    BIGINT original_amount_paise
    BIGINT discount_paise
    BIGINT loyalty_points_used
    BIGINT loyalty_points_earned
  }
  PROMOTIONS {
    UUID id PK
    VARCHAR code UK
    VARCHAR discount_type
    NUMERIC discount_value
    INT usage_count
  }
  PROMOTION_REDEMPTIONS {
    UUID id PK
    UUID promotion_id FK
    UUID user_id FK
    UUID payment_order_id FK,UK
    BIGINT discount_paise
  }
  LOYALTY_WALLETS {
    UUID user_id PK,FK
    BIGINT points_balance
    BIGINT lifetime_earned
    BIGINT lifetime_redeemed
  }
  LOYALTY_TRANSACTIONS {
    UUID id PK
    UUID user_id FK
    UUID payment_order_id FK
    BIGINT points
    VARCHAR transaction_type
  }
  USERS ||--o{ PAYMENT_ORDERS : pays
  PROMOTIONS ||--o{ PROMOTION_REDEMPTIONS : applied
  USERS ||--o{ PROMOTION_REDEMPTIONS : claims
  PAYMENT_ORDERS ||--o| PROMOTION_REDEMPTIONS : discounted
  USERS ||--o| LOYALTY_WALLETS : holds
  USERS ||--o{ LOYALTY_TRANSACTIONS : records
  PAYMENT_ORDERS |o--o{ LOYALTY_TRANSACTIONS : linked
```

**Important constraints:** promotion dates and usage limits, nonnegative loyalty balances, one promotion redemption per payment order. Refund adjustments can change earned/redeemed loyalty: audit subsequent migrations `V54__loyalty_refund_debt.sql` and business-service logic before settling accounts.

## 4. Activity and geolocation audit (conceptual from committed tables)

The existing `audit_logs` table has an immutable trigger in `V13__reports_audit_hardening.sql`; later `V37__audit_event_geolocation.sql` adds location evidence. It records HTTP status, correlation ID, actor when authenticated, request route and optional client-provided coordinates. **A self-reported GPS point is evidence of a claim, not trusted proof of physical presence.**

```mermaid
erDiagram
  USERS {
    UUID id PK
  }
  AUDIT_LOGS {
    UUID id PK
    UUID actor_user_id FK
    VARCHAR http_method
    VARCHAR request_path
    INT response_status
    VARCHAR action
    VARCHAR resource_type
    VARCHAR correlation_id
    BIGINT duration_ms
    NUMERIC latitude
    NUMERIC longitude
    VARCHAR location_status
  }
  USERS |o--o{ AUDIT_LOGS : actor
```

**Security:** log only sanitized paths; do not store bearer tokens, OTP, passwords, payment keys, PAN/identity data or untrusted forwarding headers as an identity source. Access to location and audit details must be role-scoped, with documented retention and deletion policy. Do not overwrite immutable audit rows.

## 5. Physical verification and handover

```bash
# Approved read-only PostgreSQL export (do not commit unreviewed DDL or secrets)
pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL" > schema-only.sql
# Compare Flyway history and indexed source before a migration
bash scripts/migrate-playnexa.sh plan
```

Use production migration approval and a *restored staging backup* before running the existing guarded `scripts/migrate-playnexa.sh migrate`; see the migration runbook. **Never copy or renumber an overlapping Jnapanam migration without a reviewed migration-lineage reconciliation.**
