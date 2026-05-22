# Release Process

Releases are delivered through Docker images and the production compose stack.

## 1. Validate locally

Use the existing repository commands:

```bash
cd backend && npm test
cd frontend && npm run build
```

## 2. Publish images

Build and push multi-arch images with:

```bash
./docker-compose/build-and-push-platform.sh latest
```

Notes:

- publishes `linux/amd64` and `linux/arm64`
- uses the configured Docker namespace
- production compose defaults to `andycyx`

## 3. Production stack expectations

`docker-compose/docker-compose.yml` should:

- pull published images
- not build from source
- apply schema sync on backend startup
- seed required roles/settings/admin data

## 4. Restart production

```bash
docker compose --env-file docker-compose/.env -f docker-compose/docker-compose.yml pull backend frontend
docker compose --env-file docker-compose/.env -f docker-compose/docker-compose.yml up -d backend frontend
```

## 5. Release checklist

- backend tests pass
- frontend build passes
- Docker images are pushed
- compose restart succeeds
- backend health endpoint responds
- root admin WhatsApp session starts cleanly
- persisted user sessions reload without racing the root session

## 6. Packaging rules

Do not publish:

- `.env`
- `node_modules`
- uploads
- `.wwebjs_auth`
- database volumes

The runtime state should stay in persistent volumes managed by the deployment environment.
