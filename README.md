# WhatsApp Web Tool

Multi-tenant WhatsApp operations, user-managed messaging API keys, and community polling in one full-stack platform.

## What the platform does

- Gives each user an isolated WhatsApp session backed by their own linked mobile number.
- Keeps the root admin WhatsApp account separate for platform administration and backend tasks.
- Lets admins create users, control poll permissions, and manage user WhatsApp instances without seeing user-owned API keys.
- Lets users generate their own message-only API keys, review message logs, and monitor session lifecycle events.
- Provides broadcast messaging, templates, responders, scheduled sends, governance polls, and WhatsApp-aware audit trails.

## Core capabilities

### Multi-tenant WhatsApp

- Root admin session isolated from every user session.
- Per-user WhatsApp sessions persisted under `.wwebjs_auth`.
- QR and pairing-code onboarding for user-owned sessions.
- Delayed and serialized session reload on restart to reduce Chromium profile races.
- Session lifecycle logging for root and user sessions.

### User-owned API access

- Global admin-managed API keys for platform-wide integrations.
- User-owned message-only API keys scoped to the owning user.
- User dashboard only exposes the endpoints intended for user API keys.
- Admins can manage user session state without reading user secrets.

### Operations and governance

- Broadcasts to individuals, groups, and newsletters/channels.
- Template-based messaging with media support.
- Keyword responders and optional AI-assisted replies.
- Scheduled message delivery and cleanup jobs.
- Community polls with admin-controlled creation access.

## Architecture snapshot

- `backend/src/app.js` boots Express, the root WhatsApp service, delayed user-session initialization, and the scheduler.
- `backend/src/services/whatsapp.service.js` owns the root admin WhatsApp account.
- `backend/src/services/user-whatsapp.service.js` owns isolated user sessions.
- `backend/src/services/whatsapp-session-resolver.js` routes requests to the right WhatsApp layer.
- `backend/src/services/user-api-key.service.js` manages user-owned messaging API keys.
- `backend/src/services/whatsapp-launch-coordinator.js` serializes browser launches during session startup.
- `backend/src/services/whatsapp-session-log.service.js` records root and user session lifecycle events.
- `frontend/src/pages/AdminDashboard.jsx` is the main admin control surface.
- `frontend/src/pages/UserDashboard.jsx` is the user self-service surface for profile, API access, message logs, and session logs.

## Development workflow

Use npm directly inside each app directory:

```bash
cd backend && npm install
cd backend && npm test

cd frontend && npm install
cd frontend && npm run build
```

There is currently no lint script in the repository package files.

## Deployment workflow

- **Development:** run from `backend/` and `frontend/` with npm.
- **Production:** use `docker-compose/docker-compose.yml`.
- **Images:** publish with `docker-compose/build-and-push-platform.sh`.
- **Namespace:** production compose defaults to `andycyx`.

## Documentation

- [USER_GUIDE.md](./USER_GUIDE.md)
- [SECURITY.md](./SECURITY.md)
- [RELEASING.md](./RELEASING.md)

## Current release notes

### 1.6.0 current state

- Added admin-created users with isolated WhatsApp sessions.
- Added user-owned message-only API keys hidden from admins.
- Added root-vs-user WhatsApp session separation.
- Added delayed and serialized session reload with stale Chromium lock cleanup.
- Added user session logs and user-scoped transmitted message logs in the dashboard.
- Added admin control over community poll creation access.

---

Copyright 2026 WhatsApp Web Tool.
