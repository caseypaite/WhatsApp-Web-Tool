# WhatsApp Web Tool Release & Hot Patch Protocol

This document outlines the requirements for generating release packages (`.tar.gz`) that are compatible with the WhatsApp Web Tool **Hot Patch** system (Dashboard-based updates).

## Release Bundle Structure
The `Hot Patch` module expects the following directory structure inside the root of the `.tar.gz` archive:

```text
.
├── backend/
│   ├── src/                # Backend source code
│   └── package.json        # Backend dependency manifest
├── frontend/               # Pre-built static assets (the contents of /dist)
│   ├── assets/
│   ├── index.html
│   └── ...
└── README.md (optional)
```

## How to Generate a Compatible Release
Always use the provided `scripts/repackage.sh` script to generate release bundles. This script handles:
1. Building the frontend production assets.
2. Syncing backend source to a temporary production staging area.
3. Packaging the structure into a compressed tarball.

### Command:
```bash
bash scripts/repackage.sh
```
The output will be located in the `releases/` directory.

## CRITICAL RULES
1. **No `.env` files**: Never include environment configuration files in the release bundle.
2. **No `node_modules`**: Dependencies must be installed on the host/container, not bundled in the patch.
3. **No `.wwebjs_auth`**: Never bundle WhatsApp session data.
4. **Idempotent SQL**: Any database changes in `backend/src/db/acl_schema.sql` must use `IF NOT EXISTS` or `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to ensure existing data is preserved during the patch synchronization.

## Docker Deployment Note
Because production uses **persistent code volumes**, applying a Hot Patch via the dashboard is the preferred method for updating running instances. Manual image rebuilds (`--no-cache`) may still require clearing the `./docker-compose/data/backend/*` and `./docker-compose/data/frontend/*` host directories to force a re-sync if the image contains code newer than what is on the host disk.
