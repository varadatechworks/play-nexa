# PlayNexa schema migrations V60–V65

> Source-derived migration summary as of 2026-11-27. This is not evidence that any production database has applied these versions.

| Version | File | Purpose |
|---|---|---|
| V60 | `V60__playnexa_arena_branding_settings.sql` | Dedicated arena branding settings. Singleton key is designed for one arena per dedicated database. |
| V61 | `V61__shop_counter_payment_audit.sql` | Audits counter-payment method, reference, collector and timestamp; supports idempotent counter collection. |
| V62 | `V62__playnexa_tenant_control_plane.sql` | SaaS tenant registry, verified domains, memberships, subscription lifecycle and idempotent provisioning jobs. It does not add tenant ownership to business tables and does not enable shared SaaS. |
| V63 | `V63__payment_refund_deductions.sql` | Adds non-negative `payment_refunds.deduction_paise` and an order/requested-time index. |
| V64 | `V64__payment_refund_deduction_description.sql` | Adds optional `payment_refunds.deduction_description` for auditable retained charges. |
| V65 | `V65__tenant_hosting_modes_and_customer_membership.sql` | Allows customer-hosted, PlayNexa-managed single-tenant and SaaS registry modes; adds CUSTOMER to tenant membership roles. It does not enable shared SaaS. |

## Version collision handling

Jnapanam used V60/V61 for refund deductions. PlayNexa already assigned V60 to arena branding and V61 to counter-payment audit, so the equivalent refund schema changes are forward-migrated as V63/V64. Do not copy source migration filenames or rewrite historical PlayNexa checksums. Verify the target database's `flyway_schema_history`, checksums and actual schema before any apply.

## Verification requirements

- Apply V63/V64 first to a disposable PostgreSQL database with the same preceding PlayNexa migration history.
- Verify existing `payment_refunds` rows receive `deduction_paise=0` and nullable descriptions.
- Verify the non-negative check and index; test processed and pending refunds.
- Rehearse backup/restore and migration validation before customer UAT.
- Do not enable shared SaaS based on V62; tenant data-plane ownership, RLS and hostile cross-tenant tests are still outstanding.
