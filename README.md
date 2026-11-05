# PlayNexa

**White-label sports arena management platform by Varada Techworks.**

Source application: [Jnapanam Sports Zone](https://github.com/bv-prasanna/jnapanam-sports-zone).

## Goal

Offer new arena owners a branded booking and operations experience with no arena-specific code changes. Jnapanam production remains separate and unchanged.

## Productisation principles

- Arena branding: display name, logo, favicon, colour palette, contact details, location, domain, languages and policy links.
- Arena setup: sports, facilities, courts, operating hours, slot duration, capacity, coaching, memberships and tournaments.
- Commerce: arena-owned Razorpay credentials, tax configuration, invoices, promotions, refunds and settlements.
- Roles: platform super-admin, arena admin, operator, shopkeeper, coach and customer.
- Tenant isolation: every API request, database query, background job, upload and export must be scoped to an authenticated arena/tenant; do not rely on a client-supplied tenant ID for access control.
- Demo mode: clearly labelled synthetic profiles and bookings, no live payments, SMS or email; resettable scenario data.
- Deployment: dedicated instance per arena first; shared multi-tenant SaaS only once automated isolation and security tests pass.

## Status

This repository is being initialised as a productisation workspace. It is **not yet a full migrated Jnapanam application**. See `docs/ROADMAP.md` for the integration plan.

## Configuration

`config/arena.example.json` illustrates the configuration contract. It is an example only; the existing Jnapanam web/backend/mobile applications do **not** consume it yet.

## Security

Never commit production API keys, database URLs, customer records, payment details or signing keys. Demo credentials must be synthetic and kept out of production. 
