# Database schema, migration and rollback playbook

> PlayNexa uses PostgreSQL and Flyway. **Do not treat a Markdown ER diagram as a physical schema dump.** Live migration history and the target instance must be inspected before applying anything. Last source review: 27 November 2026.

## Schema sources and index

- Canonical SQL: `apps/backend/src/main/resources/db/migration/V*__*.sql`.
- Full version/file catalogue: [SCHEMA_INDEX.md](SCHEMA_INDEX.md) and [SCHEMA_MIGRATIONS_01.md](SCHEMA_MIGRATIONS_01.md) through [SCHEMA_MIGRATIONS_06.md](SCHEMA_MIGRATIONS_06.md).
- Core logical ER diagrams: [ER_BOOKING_PAYMENTS.md](ER_BOOKING_PAYMENTS.md).
- PlayNexa migration lineage now extends through **V65**. `V60__playnexa_arena_branding_settings.sql` remains one arena per dedicated database; `V61` adds Shop counter-payment audit; `V62` adds only the SaaS control-plane registry; `V63` and `V64` add refund deduction amount/description; `V65` permits the three hosting modes in the control-plane registry and adds tenant-scoped CUSTOMER memberships. The V63/V64 SQL was adapted from later Jnapanam source migrations V60/V61 and was deliberately assigned new PlayNexa versions because those version numbers were already occupied.

**Version lineage caution:** The separate Jnapanam project has evolved independently and can use the same Flyway version number for different SQL. Do **not** merge or copy migrations from Jnapanam into PlayNexa by matching their version numbers. Flyway migration identity includes version + checksum; a version collision requires a reviewed forward-migration and baseline strategy, not blind renumbering or `flyway repair`.

## Plan and inspect (read only)

```bash
bash scripts/migrate-playnexa.sh plan
# Requires installed Flyway CLI and connection secrets supplied securely.
# Do NOT paste credentials into terminal history or commit files.
export FLYWAY_URL='jdbc:postgresql://<approved-db-host>:5432/<database>'
export FLYWAY_USER='<from-secret-store>'
# Set FLYWAY_PASSWORD securely without printing it.
bash scripts/migrate-playnexa.sh info
bash scripts/migrate-playnexa.sh validate
```

Before applying changes, record `SELECT installed_rank,version,description,checksum,success,installed_on FROM flyway_schema_history ORDER BY installed_rank;` from the **target DB**. Use a read-only account where possible for inventory. Compare with checked-in migrations. Get a backup and **rehearse a restore to a disposable instance**.

## Controlled migration after approval

```bash
export RELEASE_SHA="$(git rev-parse HEAD)"
export MIGRATION_APPROVAL=APPROVED
export RESTORE_TESTED=true
export BACKUP_REFERENCE='<approved snapshot ID in change ticket>'
# Plus FLYWAY_URL, FLYWAY_USER, FLYWAY_PASSWORD from the secret manager.
bash scripts/migrate-playnexa.sh migrate
```

The wrapper validates the immutable source SHA, disallows dirty migration files, duplicate migration versions, non-PostgreSQL targets and any Flyway clean/baseline shortcut. It runs `validate` before `migrate`. These checks **cannot verify** backup contents, target-account correctness, business-level safety or the restore claim; an operator must independently confirm those facts.

The backend also runs Flyway on startup (`spring.flyway.enabled=true`); do not run migration CLI and a new application instance concurrently without a release lock. Schedule migrations, scale backend to a controlled state, then deploy the exact approved application artifact. Post-migration schema validation is required before opening booking traffic.

## Post-migration assertions

- `flyway_schema_history` reports success and no checksum mismatch.
- Hibernate `ddl-auto=validate` succeeds and backend health is healthy.
- Unique booking slot and capacity constraints remain intact.
- Payment order and webhook idempotency constraints remain intact.
- Tax documents, credit notes and refund reconciliation still generate correctly.
- Branding row, auth/RBAC roles, default facilities and mobile app policy are configured for **that** arena.
- UAT negative cases: duplicate booking, stale hold, payment failure, repeated webhook, partial refund, wrong-role access.
- Record artifact SHA, DB version, migration operator, backup reference, status and ticket in release log.

## Rollback strategy

**Flyway SQL does not automatically provide reliable down migrations.** Prefer forward fixes if business state can be preserved; otherwise isolate the environment and restore from the previously tested backup according to the agreed RPO/RTO. Never manually delete rows from `flyway_schema_history`, run `clean` on customer data, or use `repair` to conceal a checksum mismatch.

## Multi-tenant expansion warning

A shared SaaS schema needs a complete tenant migration covering **every** user membership, facility, slot, booking, payment, refund, invoice, tax record, job, object, audit, loyalty, shop and notification. Model `arena_id` in unique constraints, foreign keys and row-level security. This migration does **not exist yet** and is an explicit blocker for removing the Java `SharedHostingSafetyGateFilter`.

## Physical schema handover export

After approving the target PostgreSQL environment and granting an inspection role with only the required read privileges, run `bash scripts/schema-export-playnexa.sh` with `PGHOST`, `PGDATABASE`, `PGUSER` and approved secret-based authentication. This **does not apply migrations**; it exports schema-only DDL and Flyway history into a permission-restricted ignored local directory. Review output before handing to customer IT and do not commit raw exports. `scripts/migrate-playnexa.sh` remains the only reviewed operator-driven migration wrapper.
