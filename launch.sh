#!/bin/bash

# CHTI Innovators Network - Launch Script
# Run this from Terminal: cd /path/to/chti-innovators-network && ./launch.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PORT=3000
echo "🚀 AI Innovators Network – Launch"
echo "=================================="
echo ""

# pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Enabling pnpm..."
    corepack enable
    corepack prepare pnpm@9.0.0 --activate
fi

# .env
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
fi

# Dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Prisma client (use exec so prisma CLI is found)
echo "🔧 Prisma: generating client..."
pnpm --filter @chti/db exec prisma generate

# Migrate OUTREACH -> QUALIFIED before schema push (OUTREACH removed from Stage enum)
pnpm --filter @chti/db exec ts-node src/migrate-outreach-to-qualified.ts 2>/dev/null || true

# Database: push schema and seed (optional; app will show setup message if DB is down)
echo "🗄  Database: pushing schema..."
if pnpm --filter @chti/db exec prisma db push --accept-data-loss 2>/dev/null; then
    echo "🗄  Database: seeding..."
    pnpm prisma:seed 2>/dev/null || echo "   (seed skipped)"
else
    echo "⚠️  Database not reachable. Start PostgreSQL and create DB:"
    echo "   brew services start postgresql@16"
    echo "   createdb chti"
    echo "   Then run ./launch.sh again. Starting app anyway..."
fi

echo ""
# Free port 3000 if something is already listening (e.g. old app instance)
LISTEN_PID=$(lsof -i :"$PORT" 2>/dev/null | grep LISTEN | awk '{print $2}' | head -1)
if [ -n "$LISTEN_PID" ]; then
  echo "⚠️  Port $PORT in use (PID $LISTEN_PID). Stopping it so the app can start..."
  kill "$LISTEN_PID" 2>/dev/null || kill -9 "$LISTEN_PID" 2>/dev/null
  sleep 1
fi

echo "✅ Starting app on http://localhost:${PORT}"
echo "   Open this URL in your browser."
echo "   Press Ctrl+C to stop."
echo ""

# Load root .env so Next.js (and /settings) see API keys (NEWSAPI, NewsData, etc.)
set -a
[ -f .env ] && . ./.env
set +a

# Use port 3000 for dev
pnpm --filter @chti/web exec next dev -p "$PORT" -H 127.0.0.1
