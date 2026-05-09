# Copilot Instructions

## Build, test, and lint commands

- For development, use npm-based workflows directly from `backend/` and `frontend/`; do not treat the root as a workspace runner.
- Backend:
  - `cd backend && npm install`
  - `cd backend && npm run start`
  - `cd backend && npm test`
  - `cd backend && node tests/basic.test.js` runs the current automated test file directly.
  - `cd backend && node tests/repro_channel_error.js` is a manual WhatsApp channel diagnostic and requires a valid authenticated session.
- Frontend:
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`
  - `cd frontend && npm run build`
  - `cd frontend && npm run preview`
- Database/bootstrap commands used by the existing docs and code:
  - `psql "$DATABASE_URL" -f backend/src/db/acl_schema.sql`
  - `node backend/src/db/seeder.js`
- There is currently no lint script in the root, backend, or frontend `package.json`.

## High-level architecture

- `backend/src/app.js` is the backend composition root. It configures Express middleware, enables cookie-based auth/CORS/rate limiting, initializes the WhatsApp client and scheduler at process startup, mounts all `/api/*` route modules, serves `/uploads` with hardened headers, and falls back to the built frontend for non-API routes.
- `backend/src/services/whatsapp.service.js` is the central long-lived integration layer. It owns the singleton `whatsapp-web.js` client, persists auth under the repo-level `.wwebjs_auth` directory, applies newsletter/channel compatibility patches, validates external media URLs before fetch, discovers only managed groups/channels, logs message outcomes, and also handles WhatsApp admin commands.
- Runtime configuration is mostly data-driven. `backend/src/services/settings.service.js` reads `system_settings` first and only falls back to environment variables for missing values; the frontend consumes public settings from `/api/settings/public`, and the standalone frontend server in `frontend/server.cjs` can inject `window._CONFIG_.VITE_API_BASE_URL` at runtime.
- Auth is intentionally hybrid. The frontend uses Axios with `withCredentials` and stores only the user object locally, while `backend/src/middleware/auth.middleware.js` accepts JWT cookies/Bearer tokens, full-access `x-api-key`, messaging-only `x-api-key`, and `x-simple-auth` in non-production.
- The frontend is a HashRouter SPA (`frontend/src/App.jsx`) wrapped in `AuthContext`. Page components and service modules talk to the backend through `frontend/src/services/api.js`; the Admin dashboard is the main operator surface for system settings, CMS content, WhatsApp controls, and the embedded API Vector Reference.
- The database contract lives in `backend/src/db/acl_schema.sql`. It models RBAC, CMS content, groups, scheduled messages, OTP verification, templates, polls, WhatsApp poll tracking, audit/history tables, AI logs, and `system_settings`; `backend/src/services/scheduler.service.js` processes scheduled sends, poll state transitions, cleanup, and the daily heartbeat against that schema.

## Key conventions

- Keep new backend endpoints under `/api/...`. External-system messaging endpoints are also exposed in the cleaner `/api/v1/...` surface and are expected to remain aligned with the API Vector Reference rendered in `frontend/src/pages/AdminDashboard.jsx`.
- Use `authenticate` + `checkRole` for protected routes instead of ad hoc role checks. The `MessagingOnly` role is intentionally special-cased so `Admin` also satisfies those endpoints, but not the reverse.
- When adding configurable behavior, wire it through `system_settings` and `SettingsService` instead of relying on environment variables alone. Public frontend settings should be exposed through `/api/settings/public` if the SPA needs them before login.
- Phone numbers are normalized to digits and default to the Indian `91` prefix when only 10 digits are supplied. WhatsApp identifiers are expected in the standard serialized forms such as `@c.us`, `@g.us`, and `@newsletter`.
- Landing-page custom HTML is sanitized twice by design: the backend sanitizes persisted CMS HTML with `sanitize-html`, and the frontend sanitizes rendered HTML with DOMPurify before `dangerouslySetInnerHTML`.
- WhatsApp newsletter/channel support has repository-specific workarounds. Managed channel detection relies on exact `membershipType`/role checks (`admin`, `owner`, `creator`), channel IDs are normalized to the object form expected by the frontend, and newsletter sends intentionally disable `sendSeen` with a fallback that treats the known response-parsing crash as a successful send.
- For development, work from the npm commands in `backend/` and `frontend/`. For production, use `docker-compose/docker-compose.yml`.
- Do not delete `.wwebjs_auth` unless the task explicitly requires resetting the WhatsApp login.
- The repository version is intentionally frozen at `1.6.0`; do not bump package versions unless the task explicitly asks for it.
- For diagnostics and test messaging, only use these approved WhatsApp targets:
  - Group: `120363424576973245@g.us`
  - Channel: `120363426680295156@newsletter`
  - Individual: `919560436836@c.us`
