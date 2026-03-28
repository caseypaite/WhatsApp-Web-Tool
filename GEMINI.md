# AppStack: WhatsApp Web Tool - Instructional Context

This document provides foundational context and mandates for the AppStack project. Adhere strictly to these guidelines for all development, maintenance, and architectural tasks.

## Development Testing Constraints
- **Restricted Targets**: For all development, testing, and diagnostic purposes, ONLY use the following entities. DO NOT send test messages, alerts, or broadcasts to any other IDs.
    - **Test Group**: `120363424576973245@g.us`
    - **Test Channel**: `120363426680295156@newsletter`
    - **Test Individual**: `919560436836@c.us`
- **Version Control**: The system version is frozen at **1.6.0**. DO NOT increment the version number in package.json or documentation. Use identifying strings (e.g., `1.6.0-patch-xyz`) for Git tags only.

## 1. Project Overview
AppStack is a full-stack platform designed for secure identity management, automated WhatsApp communication, and advanced community governance. It integrates WhatsApp automation with a robust RBAC-enabled web portal.

### Core Technologies
- **Frontend**: React (Vite) with Tailwind CSS, Lucide Icons, and Recharts.
- **Backend**: Node.js (Express) with PostgreSQL (pg).
- **Automation**: `whatsapp-web.js` (Puppeteer-driven).
- **Security**: JWT, Bcrypt, and WhatsApp-based OTP verification.
- **AI**: Integration with Google Gemini and Mistral AI.

## 2. Architecture & Structure
The project is organized into a dual-directory structure:

- `backend/`: Node.js Express server.
- `frontend/`: React Vite application.
- `production/`: Optimized production build.
    - `production/backend/`: Minified/bundled backend code.
    - `production/frontend/`: Built static assets served by a custom `server.js`.
- `scripts/`: Operational scripts (e.g., `fresh-install.sh`).

### Service Architecture
The application is managed via systemd services, with separate services for development and production environments:

**Production Services**:
- `appstack-backend.service`: Runs the Express API from `production/backend` on port `4010` (default).
- `appstack-frontend.service`: Runs the static file server from `production/frontend` on port `4011` (default).

**Development Services**:
- `appstack-dev-backend.service`: Runs the development API from the root `backend/` directory on port `3085` (default).
- `appstack-dev-frontend.service`: Runs the Vite development server (`npm run dev`) from the root `frontend/` directory.

> **Note**: When switching between dev and prod backend services, ensure no lingering Chromium processes exist, as they can lock the WhatsApp session directory.

## 3. Environment & Configuration
Configuration is managed via `.env` files. **NEVER** commit `.env` files to source control.

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `PORT`: Backend server port (default: 3000/4010).
- `VITE_API_BASE_URL`: Frontend pointer to the backend API.
- `JWT_SECRET`: Secret for signing authentication tokens.
- `SIMPLE_AUTH_PASSWORD`: API key for `x-simple-auth` header.

## 4. Development Workflows

### Installation & Setup
1.  **Dependencies**: Use `npm install` in both `backend/` and `frontend/` directories.
2.  **Database**: Run `backend/src/db/acl_schema.sql` to initialize the schema.
3.  **Seeding**: Run `node backend/src/db/seeder.js` to create the initial admin and settings.
4.  **Fresh Install**: Use `bash scripts/fresh-install.sh` for automated setup.

### Running the Project
- **Backend**: `npm run start` (or `node src/app.js`).
- **Frontend**: `npm run dev` (development) or `npm run build` (production build).

### Deployment (Production)
- **Isolation Mandate**: **NEVER** modify files directly within the `production/` directory during development. All code changes must be performed in the root `backend/` and `frontend/` directories.
- **Release Ready**: The `production/` directory is reserved exclusively for minified, bundled, and release-ready code generated through the build process.
- **Update Process**: Production code is updated only via the official release deployment or update scripts.
- **Exclusion Mandate**: When creating production releases in the `production/` directory, **DO NOT** copy the `.wwebjs_auth` folder. This ensures that session-specific data is not leaked or reused across environments.
- **Minification**: Always minify JavaScript code for production and releases to optimize performance and reduce file size.
- The `production/frontend/server.js` uses `express.static` and a wildcard route `app.use((req, res) => ...)` to serve the SPA `index.html`.
- **Note**: Ensure `VITE_API_BASE_URL` is correctly set in `production/frontend/.env` before building/deploying.

## 5. Coding & Security Mandates

### Security Standards
- **RBAC**: Always verify roles using `checkRole` middleware for sensitive API endpoints.
- **Passwords**: Enforce the complexity policy (8+ chars, mixed case, numbers, special chars).
- **OTP**: Use WhatsApp-based OTP for registration, phone updates, and poll voting.
- **SQL Integrity**: Always use parameterized queries (via `pg`) to prevent SQL injection.

### Conventions
- **API Versioning**: All API routes should be prefixed with `/api/`.
- **Frontend State**: Use `AuthContext` for session management.
- **Error Handling**: Use centralized error-handling middleware in the backend.
- **API Documentation**: Maintain the **API Vector Reference** in `AdminDashboard.jsx` with active cURL examples for all `x-api-key` compatible endpoints.

## 6. Maintenance Tasks
- **Release Naming**: **NEVER** tag a release as "Stable". All releases must be tagged as "Alpha" (e.g., "Alpha v1.4.4").
- **Versioning Policy**: Always increment the version number by the smallest possible value (e.g., v1.4.3 -> v1.4.4).
- **WhatsApp Session**: Managed via `.wwebjs_auth`. Do not delete this folder unless a fresh login is required.
- **Daily Heartbeat**: Monitor the daily system health reports sent to Super Admins.
- Repackaging: When creating releases, exclude `node_modules`, `.env`, and session files.

## 7. Technical Implementation Reference

### Entity Management (isAdmin Logic)
The system uses specific logic to determine administrative authority over WhatsApp entities, which is foundational for management and broadcasting features.

- **WhatsApp Groups:**
    - Implementation: Dynamically verified by searching for the bot's own ID (`this.me.wid._serialized`) within the `chat.groupMetadata.participants` array.
    - Criteria: The `isAdmin` boolean flag associated with the bot's participant entry must be `true`.

- **WhatsApp Channels (Newsletters):**
    - Implementation: Retrieved via Puppeteer injection into the internal `window.Store`. It specifically scrapes `WAWebNewsletterCollection` and cross-references with `WAWebNewsletterMetadataCollection`.
    - Criteria: Role detection is performed using a case-sensitive check on the `membershipType` property. Access is granted only if the role is exactly `'admin'`, `'owner'`, or `'creator'`.
    - Normalization: Channel IDs are normalized to the standard object format `{ _serialized, server, user }` to ensure frontend compatibility.

---
*GEMINI.md generated on March 23, 2026.*
