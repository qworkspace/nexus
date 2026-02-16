#!/bin/zsh

# Nexus Production Launcher
# Starts Next.js on port 3002 (assumes already built)

set -e  # Exit on any error

cd "$(dirname "$0")"

# Check if .next exists
if [ ! -d ".next" ]; then
  echo "[$(date)] No build found. Running npm run build first..."
  npm run build
fi

echo "[$(date)] Starting production server on port 3002..."
exec npm run start -- -p 3002
