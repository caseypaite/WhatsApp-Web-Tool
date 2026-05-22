# WhatsApp Web Tool User Guide

This guide covers deployment, administration, and day-to-day user operations for the current multi-tenant platform.

## 1. Deployment

### Development

Run the frontend and backend separately:

```bash
cd backend && npm install
cd backend && npm run start

cd frontend && npm install
cd frontend && npm run dev
```

### Production

Use the production compose stack:

```bash
docker compose --env-file docker-compose/.env -f docker-compose/docker-compose.yml up -d
```

The production stack:

- pulls Docker Hub images instead of building locally
- applies `backend/src/db/acl_schema.sql` on backend startup
- seeds required roles/settings/admin data
- persists PostgreSQL data, uploads, and WhatsApp auth state

## 2. Administrator guide

### User management

Admins can:

- create users directly from the admin dashboard
- activate or deactivate accounts
- grant or revoke community poll creation access
- open and manage a user's isolated WhatsApp instance

### Root admin WhatsApp account

The admin WhatsApp page controls the **root** platform account only. It is separate from every user-linked WhatsApp session.

Use it for:

- backend administrative messaging
- platform-level WhatsApp operations
- managed groups/channels discovery

Do not treat the root session as a shared user account.

### Logs

The admin dashboard **Logs** view shows platform-wide message history. Use it for operational auditing and troubleshooting.

## 3. User guide

### Profile and WhatsApp session

Each user can link their own WhatsApp number from **My Profile**.

Available actions:

- generate QR code
- request pairing code
- disconnect the linked session
- review session lifecycle events in **Session Logs**

Logging out of the web app does **not** disconnect the user WhatsApp session. The session continues to persist in the background until the user explicitly disconnects it.

### API access

From **API Access**, users can:

- create their own message-only API keys
- rename, rotate, disable, or delete those keys
- review the user-only API reference

Admins can manage user access and session state, but they do **not** see user-owned API key secrets.

### Message logs

The user dashboard includes **Message Logs** for transmissions sent through that user's session or user-owned API keys.

### Polls

Users can participate in polls from the dashboard. Poll creation is controlled by admins on a per-user basis.

## 4. Messaging and automation

The platform supports:

- broadcasts
- scheduled messages
- templates with media
- keyword responders
- AI-assisted reply flows when enabled
- native WhatsApp polls and internal governance polls

## 5. Troubleshooting

### QR or session startup issues

- ensure the container or host has network access
- avoid manually deleting `.wwebjs_auth` unless a full re-link is intended
- check the user or root **Session Logs** first

### Restart behavior

Persisted user sessions reload in delayed order, while the root session starts first. Browser launches are serialized to reduce Chromium profile lock races.

### API key confusion

- platform-level keys are admin-managed
- user dashboard keys are user-owned and scoped to that user

## 6. Validation commands

```bash
cd backend && npm test
cd frontend && npm run build
```
