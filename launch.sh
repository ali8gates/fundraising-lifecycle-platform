#!/bin/bash

# CHTI Innovators Network - Launch Script
# This script helps you quickly launch the CHTI Innovators Network app

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 CHTI Innovators Network - Launch Script"
echo "=========================================="
echo ""

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Setting up pnpm..."
    corepack enable
    corepack prepare pnpm@9.0.0 --activate
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
    echo ""
fi

# Check if PostgreSQL is running
if ! brew services list | grep -q "postgresql.*started"; then
    echo "⚠️  PostgreSQL doesn't appear to be running."
    echo "   Start it with: brew services start postgresql@16"
    echo ""
fi

# Check if Redis is running
if ! brew services list | grep -q "redis.*started"; then
    echo "⚠️  Redis doesn't appear to be running."
    echo "   Start it with: brew services start redis"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Generate Prisma client if needed
if [ ! -d "packages/db/node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma client..."
    pnpm --filter @chti/db prisma generate
    echo ""
fi

echo "✅ Starting development server..."
echo "🌐 App will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the app
pnpm dev
