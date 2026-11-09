# Error/status messages, operational logs and security review

> Static implementation audit; not a live security penetration test. Use this as the standard for new code and UAT across all 38 web routes and 21 Expo screen routes.

## Status codes and UI response policy

| HTTP code | Meaning / expected user experience | Required server behavior |
|---|---|---|
| 200/201 | Action succeeded; show confirmed state from server | Do not equate checkout popup with a paid booking |
| 202 | Accepted/pending work; show pending, not completed | Return job/reference ID when available |
| 204 | Success with no body; avoid JSON parse errors | No payload required |
| 400/422 | Validation error; identify safe fields and correction | No Java exception traces, SQL or PII |
| 401 | Invalid credentials/expired session; MFA required must remain distinguishable | Return `MFA_REQUIRED` for OTP challenge, rotate refresh tokens safely |
| 403 | Authenticated but role lacks permission; do not sign out | Enforce RBAC on backend |
| 404 | Booking/resource unavailable; show refresh/navigation | Avoid disclosing existence of other users' records |
| 409 | Booking race, stale brand revision or duplicate action; offer retry/reload | Atomic capacity checks, uniqueness and optimistic version |
| 413 | Uploaded media too large; show supported limits | 4xx, no 500 for size-only issue |
| 426 | Supported app version required; point to correct arena APK | Do not reuse Jnapanam QR/app link |
| 429 | Too many requests; friendly cooldown | Server rate limit; `Retry-After` when possible |
| 500 | Unexpected failure; neutral message with support reference | Log safe class/code + correlation, never log tokens |
| 502/503/504 | Provider/network/maintenance timeout; preserve pending transaction state | Retry safely, no duplicate payment or booking |

Web `apps/web/lib/api.ts` centralizes JSON, refresh/session handling and basic user-facing messages. Mobile API failure texts must be similarly sanitized and translated. The backend's `GlobalExceptionHandler` uses RFC 9457-style `ProblemDetail`, stable `code` properties and a correlation `requestId` where present. Error responses should have `Cache-Control: no-store`.

## Safe logging and tracing

- **Request:** `X-Correlation-ID` (generated for absent/invalid supplied value; 8–80 alphanumeric/underscore/hyphen), route template/sanitized path, HTTP verb, timing, status, operation/error code and authenticated actor if authorized.
- **Location:** only with consent and policy, with appropriate retention, never more precision than required; treat client coordinates as untrusted.
- **Server:** masked exception class/category, not exception message or full request body, password, OTP, API key, PAN, GST identity or entire payment webhook payload.
- **Admin error logs:** read only for authorised ADMIN/SUPER_ADMIN; avoid unsafe data export and direct secrets; display reference IDs so support can correlate gateway/retry incidents.
- **Metrics:** 5xx by endpoint, rate-limit volume, held-slot expiry, payment webhook errors, provider reconciliation backlog, refund failures and failed operator check-ins.

**Observed source:** `ApiRequestTelemetryFilter`, `AdminAuditFilter`, `GlobalExceptionHandler`, `apps/web/app/admin/errors`. The filters still use legacy internal attribute names beginning `jnapanam.`; those names are internal implementation details, not intended public branding. Confirm retention, masking and admin authorization with integration tests and deployed log sink.

## Production configuration checks introduced in this review

- Explicit DB URL/user/password, distinct production JWT key and short access expiry.
- Production payment provider must be Razorpay with key/secret/webhook secret, not `mock`.
- No fixed/test OTP or exposure of password-reset tokens in production.
- Exact HTTPS CORS origins, not `localhost` or wildcards.
- Swagger/OpenAPI endpoints denied for production configuration.
- The shared-hosting safety gate remains active until real cross-tenant isolation.

These checks run when `APP_ENV=production`/`prod` or an active Spring `prod`/`production` profile is configured. Deployment managers MUST set one of those indicators; otherwise development safeguards remain permissive. Do not assume a platform domain by itself activates production mode.

## Negative UAT coverage

- Wrong password does not start MFA; correct privileged password produces MFA only after delivery is verified.
- 401 session refresh and logout; 403 role denial must not clear a healthy session.
- Inactive sports and facilities must not appear as bookable; stale/expired holds must release capacity.
- Retry concurrent bookings beyond capacity; expect 409/appropriate domain error, never oversell.
- Payment capture failure, browser return before webhook, duplicate webhooks, refund already processed, refund partially completed.
- Missing GST identity prevents falsely issuing an official invoice; customer sees actionable setup status.
- Broken logo/QR/custom arena domain, expired APK, failed notification, Kannada translation, small-screen usability.
- Cross-tenant attempt in SaaS must fail for *every* path before enabling shared production. The existing Java safety filter blocks SaaS entirely for now.

## UI/UX accessibility checklist

Every web/mobile screen requires actual human/automated browser/device validation for keyboard navigation, contrast, touch targets, loading/empty/error/success states, focus management, form label/validation, scroll on narrow Android screens, English/Kannada text overflow and device back behavior. The new `npm run audit:routes` reports **source-level review flags only**; it does not substitute for rendered or device UAT.
