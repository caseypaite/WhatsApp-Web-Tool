# Build Stage
FROM node:20 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Default config.js to prevent 404 if script fails
RUN touch /usr/share/nginx/html/config.js

# Custom nginx config for SPA routing
RUN printf "server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html;\n        try_files \$uri \$uri/ /index.html;\n    }\n}\n" > /etc/nginx/conf.d/default.conf

# Entrypoint script to inject environment variables at runtime
RUN printf "#!/bin/sh\necho \"window._CONFIG_ = { VITE_API_BASE_URL: '\$VITE_API_BASE_URL' };\" > /usr/share/nginx/html/config.js\nexec nginx -g 'daemon off;'\n" > /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
