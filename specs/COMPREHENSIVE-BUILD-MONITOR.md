# Mission Control: Dev Agent Build Monitor

## Overview

A dedicated view for monitoring dev agent builds in real-time — see what's building, progress indicators, build logs, and quick actions to manage the development pipeline.

**Why this matters:** PJ wants visibility into what dev agents are doing. This makes the "dev shop" transparent and manageable.

**Estimated build time:** 2 hours

---

## User Stories

1. **As PJ, I want to see** all active dev agent builds at a glance
2. **As PJ, I want to know** how long each build has been running
3. **As PJ, I want to see** when builds complete (success/failure)
4. **As Q, I want to** track what's been spawned and what's done
5. **As Q, I want to** quickly respawn failed builds

---

## Features

### 1. Active Builds Panel

**Shows all currently running dev agent sessions:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔨 ACTIVE BUILDS (3)                       [Refresh 🔄]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ cryptomon-portfolio-experience              ● BUILDING  │ │
│ │ ━━━━━━━━━━━━░░░░░░░░░░░░░░░░ ~45% (est)               │ │
│ │ Started: 16:42 | Running: 12m 34s                      │ │
│ │ Task: "Build the CryptoMon Complete Portfolio..."      │ │
│ │                                    [View Logs] [Kill]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ mission-control-live-dashboard              ● BUILDING  │ │
│ │ ━━━━━━━━━━━━━━━━░░░░░░░░░░░░ ~55% (est)               │ │
│ │ Started: 16:42 | Running: 12m 34s                      │ │
│ │ Task: "Build the Mission Control Live Operations..."   │ │
│ │                                    [View Logs] [Kill]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Progress estimation:**
- Based on expected duration from spec
- Or based on token usage patterns
- Shows "~X%" with disclaimer it's estimated

### 2. Recent Completions

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ RECENT COMPLETIONS (Today)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 16:38 │ cryptomon-market          │ ✓ SUCCESS │ 14m 28s   │
│ 16:36 │ cryptomon-compare-fix     │ ✓ SUCCESS │ 11m 51s   │
│ 16:34 │ cryptomon-compare         │ ✓ SUCCESS │ 12m 21s   │
│ 16:33 │ cryptomon-goals-v2        │ ✓ SUCCESS │  6m 39s   │
│ 16:30 │ mission-control-agents    │ ✓ SUCCESS │  5m 59s   │
│ 16:29 │ mission-control-memory    │ ✓ SUCCESS │  1m 53s   │
│ 16:26 │ cryptomon-watchlist       │ ✓ SUCCESS │  3m  5s   │
│ 16:24 │ cryptomon-analytics       │ ✓ SUCCESS │  7m  0s   │
│ 16:22 │ cryptomon-export          │ ✓ SUCCESS │  4m 35s   │
│ 16:21 │ mission-control-crons     │ ✓ SUCCESS │  4m 23s   │
│                                                             │
│                               [View All History →]          │
└─────────────────────────────────────────────────────────────┘
```

### 3. Build Queue

**Specs waiting to be built:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 BUILD QUEUE (2)                         [+ Add Spec]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. cryptomon-telegram-alerts                                │
│    Spec: COMPREHENSIVE-TELEGRAM-ALERTS.md                   │
│    Est: 1.5-2 hours                     [Spawn Now] [Edit] │
│                                                             │
│ 2. mission-control-api-integration                          │
│    Spec: COMPREHENSIVE-API-INTEGRATION.md                   │
│    Est: 2-3 hours                       [Spawn Now] [Edit] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Build Statistics

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 TODAY'S STATS                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Builds Completed    12        Avg Duration    6m 42s     │
│   Currently Building   2        Success Rate    100%       │
│   Queue Size          2        Total Time      1h 20m     │
│                                                             │
│   Most Productive Hour: 16:00-17:00 (8 builds)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Failed Builds (if any)

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ FAILED BUILDS                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 15:45 │ cryptomon-goals │ TypeScript error in compare.tsx  │
│       │                 │                [View] [Respawn]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Data Structures

```typescript
interface BuildSession {
  id: string;
  label: string;
  task: string;
  specPath?: string;
  status: 'building' | 'complete' | 'error';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  estimatedDuration?: number;
  tokenUsage?: number;
  error?: string;
  result?: string; // Summary from completion
}

interface BuildQueue {
  items: QueuedSpec[];
}

interface QueuedSpec {
  id: string;
  name: string;
  specPath: string;
  estimatedDuration: string;
  addedAt: Date;
}

interface BuildStats {
  completedToday: number;
  currentlyBuilding: number;
  queueSize: number;
  avgDuration: number;
  successRate: number;
  totalTimeToday: number;
}
```

### File Structure

```
src/app/builds/
├── page.tsx              # Main builds page
└── components/
    ├── ActiveBuilds.tsx  # Currently running
    ├── RecentBuilds.tsx  # Completions list
    ├── BuildQueue.tsx    # Queued specs
    ├── BuildStats.tsx    # Statistics
    └── FailedBuilds.tsx  # Error list
src/stores/
└── buildStore.ts         # Build tracking state
src/lib/
└── build-mock.ts         # Mock data for builds
```

### Mock Data

```typescript
const mockActiveBuilds: BuildSession[] = [
  {
    id: '48e53cdd',
    label: 'cryptomon-portfolio-experience',
    task: 'Build the CryptoMon Complete Portfolio Experience...',
    status: 'building',
    startedAt: new Date('2026-02-07T16:42:00'),
    estimatedDuration: 7200, // 2 hours
  },
  // ...
];

const mockRecentBuilds: BuildSession[] = [
  {
    id: 'c1557883',
    label: 'cryptomon-market',
    task: 'Build Market Overview dashboard...',
    status: 'complete',
    startedAt: new Date('2026-02-07T16:22:00'),
    completedAt: new Date('2026-02-07T16:36:28'),
    duration: 868,
  },
  // ...
];
```

---

## Acceptance Criteria

### Must Have
- [ ] /builds page exists with all 5 sections
- [ ] Active builds show with progress indicators
- [ ] Recent completions list works
- [ ] Build queue displays
- [ ] Statistics panel shows counts
- [ ] Navigation item added
- [ ] Build passes: `npm run build`

### Should Have
- [ ] Auto-refresh every 30 seconds
- [ ] Click to expand build details
- [ ] Copy task/error text

### Nice to Have
- [ ] Spawn from queue button (mock action)
- [ ] Kill build button (mock action)
- [ ] Build duration chart

---

## Design Notes

- Match existing Mission Control style
- Use green/yellow/red status colors
- Progress bars: zinc-700 bg, green-500 fill
- Cards for each build
- Compact list for history
