#!/bin/bash
# Nexus Rebuild Script
# Stops service → cleans → builds → restarts
# Usage: bash scripts/rebuild.sh

set -e

echo "🔄 Rebuilding Nexus..."

# Stop the service
echo "⏹️  Stopping Nexus service..."
launchctl unload ~/Library/LaunchAgents/com.pv.nexus.plist 2>/dev/null || true

# Kill any zombie next processes
pkill -f "next-server" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

# Clean build cache
echo "🧹 Cleaning .next cache..."
rm -rf .next

# Build
echo "🔨 Building..."
cd /Users/paulvillanueva/projects/mission-control
npm run build

# Restart service
echo "🚀 Starting Nexus service..."
launchctl load ~/Library/LaunchAgents/com.pv.nexus.plist

echo "✅ Nexus rebuilt and running on http://localhost:3001"
