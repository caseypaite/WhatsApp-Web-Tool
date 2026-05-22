# Copilot Instructions

## Build, test, and deployment commands

- Development uses npm directly from `backend/` and `frontend/`.
- Backend:
  - `cd backend && npm install`
  - `cd backend && npm run start`
  - `cd backend && npm test`
- Frontend:
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`
  - `cd frontend && npm run build`
- Production uses `docker-compose/docker-compose.yml`.
- Multi-arch Docker publishing uses `docker-compose/build-and-push-platform.sh`.
- There is no lint script in the current package files.

## Architecture notes

- `backend/src/services/whatsapp.service.js` owns the root admin WhatsApp account.
- `backend/src/services/user-whatsapp.service.js` owns isolated per-user WhatsApp sessions.
- `backend/src/services/whatsapp-session-resolver.js` selects the correct session layer for each request.
- `backend/src/services/user-api-key.service.js` manages user-owned message-only API keys.
- `backend/src/services/whatsapp-launch-coordinator.js` serializes browser launches to reduce Chromium profile races.
- `backend/src/services/whatsapp-session-log.service.js` records root and user session lifecycle events.
- `frontend/src/pages/AdminDashboard.jsx` is the platform operations surface.
- `frontend/src/pages/UserDashboard.jsx` is the self-service user surface for profile, API keys, message logs, and session logs.

## Current product behavior

- Root admin WhatsApp is isolated from every user-linked WhatsApp session.
- Admins can manage user session state but must not see user-owned API key secrets.
- User sessions persist in the background when a user logs out of the web app.
- Persisted user sessions reload after restart with a delayed warmup so the root session gets priority.
- Community poll creation is controlled per user by admin-managed permission.

## Development conventions

- Prefer new backend routes under `/api/...`.
- Reuse existing auth middleware and role checks.
- Wire configurable behavior through `system_settings` and `SettingsService`.
- Keep WhatsApp identifiers in serialized forms like `@c.us`, `@g.us`, and `@newsletter`.
- Do not delete `.wwebjs_auth` unless the task explicitly intends to reset login state.
- The repository version remains `1.6.0` unless explicitly changed by the user.
