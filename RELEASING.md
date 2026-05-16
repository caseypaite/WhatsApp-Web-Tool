# WhatsApp Web Tool Release Process

This project no longer generates or accepts `.tar.gz` release bundles. Releases are promoted through Docker images that have already passed dev and production startup validation.

## Release Package Contents

The published release package contains only:

```text
.
├── .env.example
└── docker-compose.yml
```

- `.env.example` is published from `docker-compose/.env.example`
- `docker-compose.yml` is published from `docker-compose/docker-compose.release.yml`

## Release Flow

1. Validate the updated backend and frontend images in development.
2. Update the production stack with those images.
3. Confirm production launches successfully.
4. Push the verified images to Docker Hub with an explicit platform:
   ```bash
   ./docker-compose/build-and-push-platform.sh 1.6.0-beta-rev4 latest
   ```
   - The script auto-detects the Docker Hub namespace from the configured Docker login.
   - The script configures a dedicated buildx builder and publishes a multi-arch manifest for `linux/amd64,linux/arm64`.
   - Override detection with `DOCKER_NAMESPACE=...` or `DOCKER_PLATFORMS=linux/amd64` when needed.
5. Publish the release package containing only `.env.example` and `docker-compose.yml`.

## Compose Requirements

- `docker-compose/docker-compose.release.yml` must pull Docker Hub images and must not build from source.
- `docker-compose/docker-compose.release.yml` resolves the image namespace from `DOCKER_NAMESPACE` and defaults to `andycyx`.
- Database updates must remain idempotent in `backend/src/db/acl_schema.sql` because the backend applies schema sync on startup before seeding.
- Never include `.env`, `node_modules`, uploads, or `.wwebjs_auth` in the release package.

## Deployment Command

```bash
docker compose --env-file .env -f docker-compose.yml up -d
```

The release compose file is expected to work with only the two published files plus the persistent Docker volumes for PostgreSQL data, uploads, and WhatsApp session state.
