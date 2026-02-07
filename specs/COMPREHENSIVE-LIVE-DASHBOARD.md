# Mission Control: Live Operations Dashboard

## Overview

A real-time operations dashboard that gives PJ instant visibility into Q's entire ecosystem — sessions, agents, crons, costs, and health — all in one place.

**Why this matters:** Right now, PJ has to ask Q for status updates. This dashboard makes Q's operations self-documenting and transparent.

**Estimated build time:** 2-3 hours

---

## Core Features

### 1. Live Session Monitor

**What it does:** Shows all active sessions in real-time with key metrics.

**UI Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ ACTIVE SESSIONS (3)                           [Refresh 🔄] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🦾 Main Session (Q ↔ PJ)                    ● ACTIVE   │ │
│ │ Model: opus | Tokens: 45.2k | Duration: 2h 34m        │ │
│ │ Last: "Got it. Mission Control + CryptoMon..."        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 Dev Agent (cryptomon-market)             ● BUILDING │ │
│ │ Model: glm-4.7 | Tokens: 12.1k | Duration: 4m 23s     │ │
│ │ Task: "Build Market Overview dashboard..."            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔄 Cron (Afternoon Joke)                    ✓ COMPLETE │ │
│ │ Model: opus | Tokens: 1.2k | Duration: 16s            │ │
│ │ Result: "My DAW crashed..."                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Data Structure:**
```typescript
interface LiveSession {
  key: string;
  displayName: string;
  kind: 'main' | 'spawn' | 'cron';
  agent: string;
  agentEmoji: string;
  model: string;
  status: 'active' | 'building' | 'complete' | 'error';
  tokenUsage: number;
  duration: number; // seconds
  lastMessage: string;
  task?: string;
  startedAt: Date;
  updatedAt: Date;
}
```

**Behaviors:**
- Auto-refresh every 10 seconds
- Manual refresh button
- Click to expand full session details
- Filter by: All | Main | Agents | Crons
- Sort by: Most recent | Duration | Tokens

---

### 2. Agent Fleet Status

**What it does:** Bird's eye view of all 9 agents with real-time status.

**UI Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ AGENT FLEET                                                 │
├─────────────────────────────────────────────────────────────┤
│  🦾 Q        ● Online    │  💻 Dev      ● Busy (3 tasks)   │
│  🎨 Creative ○ Idle      │  📈 Growth   ○ Idle             │
│  🔍 Research ○ Idle      │  🎪 Events   ○ Idle             │
│  💬 Support  ○ Idle      │  🎨 Design   ○ Idle             │
│  🧪 Testing  ○ Idle      │                                 │
├─────────────────────────────────────────────────────────────┤
│ Fleet Stats: 2 active | 7 idle | 0 errors | 12 tasks today │
└─────────────────────────────────────────────────────────────┘
```

**Click to expand:** Shows agent's current tasks, recent completions, token usage today.

---

### 3. Cron Health Panel

**What it does:** Shows upcoming crons and recent execution status.

**UI Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ CRON HEALTH                              [View All →]       │
├─────────────────────────────────────────────────────────────┤
│ UPCOMING (Next 2 hours)                                     │
│ • 16:30 - Cron Failure Monitor          in 2 min           │
│ • 18:17 - Discord Digest (Evening)      in 1h 49m          │
│ • 18:22 - Riddle Answer Reveal          in 1h 54m          │
├─────────────────────────────────────────────────────────────┤
│ RECENT (Last 2 hours)                                       │
│ • 16:07 - Afternoon Joke                ✓ OK (16s)         │
│ • 16:00 - Cron Failure Monitor          ✓ OK (60s)         │
│ • 15:13 - Wellness Check (Afternoon)    ✓ OK (26s)         │
├─────────────────────────────────────────────────────────────┤
│ Health: 49 jobs | 3 ran today | 0 failures | Next: 2m      │
└─────────────────────────────────────────────────────────────┘
```

**Alert indicators:**
- 🟢 Green = OK
- 🟡 Yellow = Slow (>2x expected duration)
- 🔴 Red = Failed

---

### 4. Cost Ticker

**What it does:** Real-time cost tracking with budget awareness.

**UI Components:**
```
┌─────────────────────────────────────────────────────────────┐
│ TODAY'S COSTS                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   $12.47 today         ████████░░░░░░░░  52% of $24 budget │
│                                                             │
│   By Model:  Opus $11.20 | Sonnet $1.27 | GLM $0.00        │
│   By Agent:  Q $10.50 | Dev $0.00 | Others $1.97           │
│                                                             │
│   Projection: ~$18.70 by midnight (within budget ✓)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Quick Actions Bar

**What it does:** One-click access to common operations.

**Actions:**
- [Spawn Dev Agent] — Opens task input modal
- [Run Cron Now] — Dropdown to trigger any cron
- [Switch Model] — Quick model change for main session
- [View Logs] — Opens log viewer
- [Emergency Stop] — Kills all spawned sessions

---

## Technical Implementation

### File Structure
```
src/app/dashboard/
├── page.tsx              # Main dashboard layout
├── components/
│   ├── LiveSessions.tsx  # Session monitor
│   ├── AgentFleet.tsx    # Agent status grid
│   ├── CronHealth.tsx    # Cron panel
│   ├── CostTicker.tsx    # Cost tracking
│   └── QuickActions.tsx  # Action buttons
└── hooks/
    ├── useSessions.ts    # Polling for sessions
    ├── useCrons.ts       # Cron data fetching
    └── useCosts.ts       # Cost calculations
```

### Data Fetching

**Option A: Mock data first (for build)**
- Create realistic mock data matching OpenClaw structures
- Simulate real-time updates with intervals
- Easy to swap for real API later

**Option B: Real API integration (stretch goal)**
- Call OpenClaw gateway endpoints
- WebSocket for real-time updates
- Requires API route proxying

### State Management
- Use React Query or SWR for data fetching
- 10-second polling interval
- Optimistic updates for actions

---

## Edge Cases & Error Handling

1. **No active sessions** — Show "All quiet" state with last activity time
2. **API unreachable** — Show stale data with "Last updated X ago" warning
3. **Cost data unavailable** — Show "Cost tracking unavailable" 
4. **Cron failures** — Highlight in red, show error message on hover
5. **Long-running sessions** — Show duration in yellow if >30min for spawns

---

## Acceptance Criteria

- [ ] Dashboard loads with all 5 panels
- [ ] Session list shows mock data correctly
- [ ] Agent fleet shows all 9 agents
- [ ] Cron health shows upcoming/recent
- [ ] Cost ticker displays with progress bar
- [ ] Quick actions buttons are clickable (can be no-op for now)
- [ ] Auto-refresh works (10 second interval)
- [ ] Responsive on tablet (1024px+)
- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors
- [ ] Follows existing design system

---

## Design Notes

- Use existing Card components
- Color scheme: zinc-900 bg, zinc-100 text
- Status colors: green-500 (ok), yellow-500 (warn), red-500 (error)
- Spacing: consistent 4/6/8 scale
- Typography: existing text-sm, text-lg classes

---

## NOT in scope (future iterations)

- Real API integration (mock data is fine)
- WebSocket real-time (polling is fine)
- Mobile view (<1024px)
- Historical data/charts
- Session transcript viewer
