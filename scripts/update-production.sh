#!/bin/bash

# AppStack Production Update Script
# This script updates the production instance from a release tarball.
# It preserves the .env file and .wwebjs_auth folder while updating all other components.

set -e

# Configuration
RELEASE_FILE=$1
PROD_DIR="/home/ubuntu/AppStack/production"
BACKUP_DIR="/home/ubuntu/AppStack/backups/$(date +%Y%m%d_%H%M%S)"

if [ -z "$RELEASE_FILE" ]; then
    echo "❌ Error: Please provide the path to the release tarball."
    echo "Usage: ./update-production.sh <path-to-release-tarball.tar.gz>"
    exit 1
fi

if [ ! -f "$RELEASE_FILE" ]; then
    echo "❌ Error: Release file $RELEASE_FILE not found."
    exit 1
fi

echo "🚀 Starting AppStack Production Update..."
echo "📦 Release: $RELEASE_FILE"
echo "📂 Production Directory: $PROD_DIR"

# Ensure production directory exists
if [ ! -d "$PROD_DIR" ]; then
    echo "❌ Error: Production directory $PROD_DIR does not exist. Please use the fresh install script for initial setup."
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📂 Creating backup in $BACKUP_DIR..."

# Backup existing configuration and important data
if [ -f "$PROD_DIR/backend/.env" ]; then
    cp "$PROD_DIR/backend/.env" "$BACKUP_DIR/backend.env"
fi
if [ -f "$PROD_DIR/frontend/.env" ]; then
    cp "$PROD_DIR/frontend/.env" "$BACKUP_DIR/frontend.env"
fi
if [ -d "$PROD_DIR/backend/.wwebjs_auth" ]; then
    cp -r "$PROD_DIR/backend/.wwebjs_auth" "$BACKUP_DIR/.wwebjs_auth"
fi

# Temporary extraction directory
EXTRACT_DIR="/tmp/appstack_update_$(date +%s)"
mkdir -p "$EXTRACT_DIR"
echo "📦 Extracting release to $EXTRACT_DIR..."
tar -xzf "$RELEASE_FILE" -C "$EXTRACT_DIR"

# Sync new files to production, excluding sensitive/persistent data
echo "🔄 Syncing new files to $PROD_DIR..."
rsync -av --delete \
    --exclude '.env' \
    --exclude '.wwebjs_auth' \
    --exclude '.wwebjs_cache' \
    --exclude 'node_modules' \
    --exclude 'uploads' \
    "$EXTRACT_DIR/" "$PROD_DIR/"

# Restore configuration from backup if needed (though rsync exclude should keep them)
echo "✅ Configuration and session data preserved."

# Install dependencies
echo "📦 Installing backend dependencies..."
cd "$PROD_DIR/backend"
rm -rf node_modules
npm install --production

echo "📦 Installing frontend dependencies..."
cd "$PROD_DIR/frontend"
rm -rf node_modules
npm install --production

# Restart services
echo "⚙️  Restarting AppStack production services..."
sudo systemctl restart appstack-backend
sudo systemctl restart appstack-frontend

# Clean up
rm -rf "$EXTRACT_DIR"

echo ""
echo "✨ Production Update Completed Successfully!"
echo "🚀 Your AppStack instance is now up to date."
