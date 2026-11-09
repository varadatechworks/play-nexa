# PlayNexa — Complete Source Migration Catalog Index
> All **59** SQL migration files on `main` were scanned in five ordered sections on 2026-11-09; source-derived, **not** confirmed deployed database state.

| Files in migration order | Documentation |
|---|---|
| 1–14 | [Part 1: table/column dictionary and ER](SCHEMA_MIGRATIONS_01.md) |
| 15–28 | [Part 2: table/column dictionary and ER](SCHEMA_MIGRATIONS_02.md) |
| 29–42 | [Part 3: table/column dictionary and ER](SCHEMA_MIGRATIONS_03.md) |
| 43–56 | [Part 4: table/column dictionary and ER](SCHEMA_MIGRATIONS_04.md) |
| 57–59 | [Part 5: table/column dictionary and ER](SCHEMA_MIGRATIONS_05.md) |

See [architecture, deployment and KT runbook](README.md) and [controlled migration script](migrate-safe.sh).

## Dedicated hosting models
- Customer-hosted dedicated database and app.
- Varada Techworks-managed single-tenant dedicated database and app.
- **Multi-tenant shared SaaS must not be offered as production-ready** until authenticated tenant isolation is proven across every table, query, background job, payment callback, object store and report. Hosting choice is not a feature tier.

## Schema and deployment acceptance
Verify exact version deployed, schema-only export, Flyway history/checksums, payment/booking race controls, facility price snapshots, refund/invoice reconciliation and branded arena isolation; rehearse rollback and backup restore before customer KT. No automated mutation is performed by these Markdown documents.

**Limits:** migration-file-group snapshots may not reflect subsequent ALTER/DROP/RENAME; SQL scanning cannot replace database introspection or tenant isolation tests.
## Physical schema inventory companion

Use [read-only schema/Flyway-history export script](../../scripts/schema-export-playnexa.sh) with an approved database inspection account. It creates permission-restricted local outputs, excluded by `.gitignore`. These outputs are **not** automatically a public deliverable and may still contain sensitive DDL defaults, so review before sharing. See [extended logical ER](ER_EXTENDED_MODULES.md) for training, membership, tournaments, promotions and audit.
