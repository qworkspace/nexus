#!/bin/bash
# Nexus Dev Cycle — Full automated build pipeline
# Usage: bash scripts/dev-cycle.sh "Bug fix description or spec label"
#
# Flow: Stop Nexus → Spark edits (wait for agent) → Rebuild → Restart → Verify
# Called by Q when spawning Spark for code changes.

set -e

PROJECT_DIR="/Users/paulvillanueva/projects/mission-control"
PLIST="$HOME/Library/LaunchAgents/com.pv.nexus.plist"
LOG_DIR="$HOME/.openclaw/logs"

DESC="${1:-No description}"

echo ""
echo "═══════════════════════════════════════════"
echo "  🔥 NEXUS DEV CYCLE"
echo "  ${DESC}"
echo "═══════════════════════════════════════════"
echo ""

# ── Phase 1: Stop ──────────────────────────────
phase_stop() {
    echo "⏹️  Phase 1: Stopping Nexus..."
    launchctl unload "$PLIST" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    sleep 1
    
    # Verify stopped
    if /usr/sbin/lsof -i :3001 -P 2>/dev/null | grep -q LISTEN; then
        echo "⚠️  Port 3001 still in use, force killing..."
        /usr/sbin/lsof -ti :3001 2>/dev/null | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    echo "✅ Nexus stopped"
}

# ── Phase 2: Clean ─────────────────────────────
phase_clean() {
    echo ""
    echo "🧹 Phase 2: Cleaning build cache..."
    cd "$PROJECT_DIR"
    rm -rf .next
    echo "✅ Cache cleaned"
}

# ── Phase 3: Build ─────────────────────────────
phase_build() {
    echo ""
    echo "🔨 Phase 3: Building..."
    cd "$PROJECT_DIR"
    
    if npm run build 2>&1 | tee "$LOG_DIR/nexus-build.log" | tail -5; then
        echo "✅ Build passed"
    else
        echo "❌ Build FAILED — check $LOG_DIR/nexus-build.log"
        echo "🔄 Restarting with previous build..."
        phase_start
        exit 1
    fi
}

# ── Phase 4: Start ─────────────────────────────
phase_start() {
    echo ""
    echo "🚀 Phase 4: Starting Nexus..."
    launchctl load "$PLIST"
    sleep 3
    
    # Verify running
    HTTP_CODE=$(curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" http://localhost:3001/dashboard)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Nexus running — http://localhost:3001 (HTTP $HTTP_CODE)"
    else
        echo "⚠️  Nexus returned HTTP $HTTP_CODE — check logs at $LOG_DIR/nexus.error.log"
    fi
    
    # Verify localhost-only binding
    BINDING=$(/usr/sbin/lsof -i :3001 -P 2>/dev/null | grep LISTEN | awk '{print $9}')
    if echo "$BINDING" | grep -q "localhost"; then
        echo "🔒 Security: Bound to localhost only"
    else
        echo "⚠️  Security: Bound to $BINDING — expected localhost!"
    fi
}

# ── Run all phases ─────────────────────────────
phase_stop
phase_clean
phase_build
phase_start

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ DEV CYCLE COMPLETE"
echo "  ${DESC}"
echo "═══════════════════════════════════════════"
echo ""
