# Arena branding operations — dedicated deployments

PlayNexa has imported `apps/backend`, `apps/web` and `apps/mobile` from the Jnapanam source. Its existing live deployment is unaffected.

Both **customer-hosted** and **PlayNexa-managed single-tenant** arrangements use the same dedicated booking engine and isolated database. The infrastructure operator differs; the complete product features do not.

## Configure arena

```bash
npm run arena:new -- --name "Victory Sports Arena" --city Bengaluru --sports "Badminton,Swimming" --deployment playnexa_managed_single_tenant
npm run arena:env -- config/tenants/victory-sports-arena.json
```

This emits only non-secret configuration. It does not deploy an instance or create live slots/payments. Provision a fresh database, domain, SSL, separate JWT/email/OTP keys, payment merchant/webhooks and backups.

After deploying with `PLAYNEXA_HOSTING_MODE=dedicated`, an authorised admin can visit **/admin/arena-branding** to edit logo, hero, colours, name, phone, city and sports. The branding service uses a single-row dedicated-instance table, optimistic revision checks and public no-cache responses.

The page does **not** create or update facilities or customer accounts. Configure the sports catalogue, courts, slot windows, taxes, dynamic pricing, user roles, notifications, payments, cancellations/refunds, memberships, coaching, tournaments and shop separately in their existing admin modules. Verify the live booking journey before opening customer registrations.

## Mobile

A dedicated Android build requires unique `ARENA_APP_NAME`, package, icon, scheme, signing keys, API endpoint and appropriate deep links. Use `PLAYNEXA_BRANDED_RELEASE=true` to fail the build when the required icon/package/scheme are not configured. Do not publish the imported Jnapanam branding to a different arena.

## Shared SaaS

A SaaS arena is a **valid customer-selected deployment choice**, but the backend remains closed to real SaaS traffic until tenant-scoped database, authentication, financial records, notifications and background jobs pass cross-tenant tests. Never set `PLAYNEXA_HOSTING_MODE=saas` to start a single-tenant backend.

## Marketplace

Not part of the current product launch or onboarding workflow. No venue is auto-listed or charged a commission.

[Full hosting and booking feature parity](PRODUCT_MODES_AND_FEATURE_PARITY.md).
