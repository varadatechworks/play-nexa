# Tenant and payment isolation requirements

This document defines release gates for future multi-arena operation. These checks have not yet been implemented in the Jnapanam backend.

- Resolve arena identity from a verified host and authenticated arena membership. Never trust an arena ID sent by a customer as proof of access.
- Use arena-scoped queries and database constraints for users, slots, bookings, payments, invoices, files, events and notifications. Use database row security where appropriate.
- Keep separate secrets and merchant credentials for each arena. Never expose them through the branding or public directory endpoints.
- Verify all payment callbacks and make booking state transitions idempotent. An arena remains the sole authority for its inventory and checkout.
- Public discovery must include only published arenas that explicitly opted in to listing.
- The synthetic demo may switch arenas using a query parameter. Production authentication and tenant selection must not use this demo mechanism.

## Release checks

Run negative tests ensuring arena A users cannot view, change, refund or check in arena B bookings. Verify unknown domains and unverified hostnames fail closed, public responses exclude secrets, and marketplace bookings do not duplicate inventory.
