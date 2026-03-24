#!/bin/bash

# AppStack Fresh Installation Script
# This script initializes the database, seeds data, and optionally sets up systemd services.

set -e

# Configuration
INSTALL_SERVICES=${INSTALL_SERVICES:-true}

echo "🚀 Starting AppStack Fresh Installation..."

# Determine base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( dirname "$SCRIPT_DIR" )"
cd "$BASE_DIR"

# Load environment variables
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
elif [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ Error: .env file not found. Please create one from .env.example first."
    exit 1
fi

# Extract DB credentials from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
DB_USER=$(echo $DATABASE_URL | sed 's/.*:\/\/\([^:]*\):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')

echo "📦 Database Configuration:"
echo "   Name: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"

# Create Database if it doesn't exist
echo "🔨 Creating database (if not exists)..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME"

# Initialize Schema
echo "📄 Initializing database schema..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f backend/src/db/acl_schema.sql

# Seed Initial Data
echo "🌱 Seeding initial administrator and settings..."
cd backend && node src/db/seeder.js && cd ..

echo "✅ Database installation completed successfully!"

# Systemd Service Setup
if [ "$INSTALL_SERVICES" = "true" ]; then
    echo "⚙️  Generating systemd service configurations..."
    
    CUR_DIR=$(pwd)
    NODE_PATH=$(which node)
    USER_NAME=$(whoami)

    # Backend Service
    CAT_BACKEND="[Unit]
Description=AppStack Backend Server
After=network.target postgresql.service

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$CUR_DIR/backend
ExecStart=$NODE_PATH src/app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target"

    # Frontend Service
    CAT_FRONTEND="[Unit]
Description=AppStack Frontend Server
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$CUR_DIR/frontend
ExecStart=$NODE_PATH server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target"

    echo "$CAT_BACKEND" > appstack-backend.service
    echo "$CAT_FRONTEND" > appstack-frontend.service

    echo "📝 Service files generated locally."
    echo "🔒 Requesting administrative privileges to install services into /etc/systemd/system/..."
    
    sudo mv appstack-backend.service /etc/systemd/system/
    sudo mv appstack-frontend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable appstack-backend
    sudo systemctl enable appstack-frontend
    
    # Restart to ensure clean state
    sudo systemctl restart appstack-backend
    sudo systemctl restart appstack-frontend
    
    echo "🚀 Services installed and started successfully!"
fi

echo ""
echo "✨ Installation Process Finished!"
