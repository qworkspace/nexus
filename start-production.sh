#!/bin/zsh

# Nexus Production Launcher
# Starts Next.js on port 3002 with memory watchdog

set -e

cd "$(dirname "$0")"

# Check if .next exists
if [ ! -d ".next" ]; then
  echo "[$(date)] No build found. Running npm run build first..."
  npm run build
fi

# Set Node.js memory limit (512MB max — prevents runaway bloat)
export NODE_OPTIONS="--max-old-space-size=512"

echo "[$(date)] Starting production server on port 3002 (512MB limit)..."
exec npm run start -- -p 3002
