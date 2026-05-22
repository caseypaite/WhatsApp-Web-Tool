# Security Documentation

This document summarizes the security model for the current WhatsApp Web Tool deployment.

## 1. Authentication

### User login

- Primary web authentication uses JWT-backed sessions.
- In production, the session token is carried by an HttpOnly cookie.
- The frontend stores the user object locally, not the session secret.

### API keys

The platform currently has two API-key ownership models:

1. **Platform-managed keys**
   - managed by admins in system settings
   - intended for platform-wide integrations

2. **User-owned messaging keys**
   - generated in the user dashboard
   - scoped to the owning user
   - route messaging activity through that user's isolated WhatsApp session

### Development fallback

`x-simple-auth` exists only for non-production and should not be relied on for deployed environments.

## 2. Session isolation

### Root admin session

- The root admin WhatsApp session is isolated from user sessions.
- It uses its own persisted auth directory and runtime state.
- It is intended for backend/admin operations only.

### User sessions

- Each user session has its own persisted LocalAuth identity.
- User sessions are restored independently from the root session.
- Browser launches are serialized to reduce profile lock races.
- Startup delay gives the root session priority before user session warmup.

### Session observability

- Root and user session lifecycle events are recorded separately.
- Users can view their own session logs.
- Admins can inspect root or targeted user session lifecycle events through the backend session log endpoint and admin tools.

## 3. Authorization

### RBAC

Current roles include:

- `SuperAdmin`
- `Admin`
- `Editor`
- `User`
- `MessagingOnly`

Route protection is enforced with authentication middleware plus `checkRole(...)`.

### Sensitive ownership boundaries

- Admins can manage user WhatsApp instances without reading user API keys.
- User API key CRUD is scoped to the authenticated owner.
- Message history is queryable per user for self-service logs and globally for admin operations.

## 4. Messaging security

### SSRF protection

External media URLs are validated before fetch:

- protocol must be `http` or `https`
- DNS resolution is checked
- private/reserved address ranges are rejected

### Logging

The system records:

- message send history
- API key labels when available
- session lifecycle events

These logs support operations and incident review without exposing secrets unnecessarily in the normal UI.

## 5. Data protection

### Passwords

- Passwords are hashed with `bcryptjs`
- The platform enforces a strong password policy

### OTP verification

WhatsApp OTP is used for sensitive operations including:

- registration
- phone updates
- password changes
- vote verification flows

## 6. Operational safeguards

- Database access uses parameterized queries.
- Runtime configuration prefers database-backed `system_settings`.
- Landing page custom HTML is sanitized on write and on render.
- `.wwebjs_auth` should only be removed when intentionally resetting WhatsApp login state.

---

Last updated: 2026-05-22
