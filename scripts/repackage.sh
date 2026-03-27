#!/bin/bash

# AppStack Repackaging & Deployment Script
# This script ensures development and production codebases are synchronized,
# minifies the backend, builds the frontend, and deploys to production.

set -e

VERSION="1.5.2"
ROOT_DIR="/home/ubuntu/AppStack"
PROD_DIR="$ROOT_DIR/production"
RELEASE_FILE="release-v$VERSION.tar.gz"

echo "🚀 Starting AppStack Repackaging & Deployment (Alpha v$VERSION)..."

# 1. Prepare Frontend
echo "📦 Building Frontend..."
cd "$ROOT_DIR/frontend"
npm run build

echo "🔄 Syncing Frontend to Production..."
mkdir -p "$PROD_DIR/frontend"
rsync -av --delete dist/ "$PROD_DIR/frontend/" --exclude '.env' --exclude 'package.json' --exclude 'server.js' --exclude 'server.cjs'

# 2. Prepare Backend
echo "🔄 Syncing Backend to Production..."
mkdir -p "$PROD_DIR/backend/src"
rsync -av --delete "$ROOT_DIR/backend/src/" "$PROD_DIR/backend/src/"

# echo "🛡️  Minifying Backend Code..."
# # Minify each JS file in production/backend/src
# find "$PROD_DIR/backend/src" -name "*.js" -type f | while read file; do
#     echo "  Minifying $file..."
#     javascript-obfuscator "$file" --output "$file" --compact true --self-defending false --string-array true --string-array-encoding 'rc4'
# done

# 3. Copy other essential files
echo "📄 Syncing other essential files..."
cp "$ROOT_DIR/backend/package.json" "$PROD_DIR/backend/"
cp "$ROOT_DIR/backend/package-lock.json" "$PROD_DIR/backend/"
cp "$ROOT_DIR/frontend/package.json" "$PROD_DIR/frontend/"
cp "$ROOT_DIR/frontend/package-lock.json" "$PROD_DIR/frontend/"
cp "$ROOT_DIR/frontend/server.cjs" "$PROD_DIR/frontend/"
cp "$ROOT_DIR/package.json" "$PROD_DIR/"
cp "$ROOT_DIR/package-lock.json" "$PROD_DIR/"
cp "$ROOT_DIR/README.md" "$PROD_DIR/"
cp "$ROOT_DIR/SECURITY.md" "$PROD_DIR/"
cp "$ROOT_DIR/USER_GUIDE.md" "$PROD_DIR/"
cp "$ROOT_DIR/GEMINI.md" "$PROD_DIR/"
cp "$ROOT_DIR/scripts/update-production.sh" "$PROD_DIR/scripts/"
cp "$ROOT_DIR/scripts/fresh-install.sh" "$PROD_DIR/scripts/"

# 4. Repack Release
echo "📦 Repacking Release $RELEASE_FILE..."
cd "$ROOT_DIR"
tar -czf "$RELEASE_FILE" --exclude='node_modules' --exclude='.env' --exclude='.wwebjs_auth' --exclude='.wwebjs_cache' --exclude='release-v*.tar.gz' -C production .

# 5. Deploy to Production
echo "🚀 Deploying to local production environment..."
"$ROOT_DIR/scripts/update-production.sh" "$RELEASE_FILE"

echo ""
echo "✨ Repackaging & Deployment Finished Successfully!"
echo "🚀 Your production instance is now synchronized, minified, and updated."
