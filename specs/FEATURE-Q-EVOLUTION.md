# Q Evolution Dashboard — Build Spec

**Date:** 2026-02-07  
**Feature:** Q Self-Improvement Tracking Dashboard

---

## Purpose

Track Q's continuous evolution across 4 pillars. Visualize progress, lessons learned, and improvement over time. "Is Q getting better?"

---

## Data Sources

### 1. EVOLUTION.md (Parse from file)
Location: `~/.openclaw/workspace/EVOLUTION.md`

Parse sections:
- 4 Pillars with status tables
- Evolution Log entries
- Quarterly Goals

### 2. LESSONS.md (Parse from file)  
Location: `~/.openclaw/workspace/LESSONS.md`

Parse:
- Total lesson count
- Recent lessons (last 5)
- Lessons by category

### 3. Existing APIs
- `/api/costs` — Token cost data (already built)
- `/api/performance` — Success rates (already built)

---

## New API Route: GET /api/evolution

```typescript
interface EvolutionData {
  // Pillars
  pillars: {
    name: string;          // "Deep Knowledge", "Agent Ecosystem", etc
    emoji: string;         // 🧠, 🤖, 🛠️, ✨
    status: 'learning' | 'ready' | 'active';
    items: {
      name: string;
      status: 'done' | 'in-progress' | 'not-started';
      owner?: string;      // "Q", "Luna", "Creative Agent"
    }[];
  }[];
  
  // Lessons
  lessons: {
    total: number;
    recent: {
      title: string;
      category: string;
      date: string;
    }[];
  };
  
  // Evolution Log
  evolutionLog: {
    date: string;
    change: string;
    impact: string;
  }[];
  
  // Goals
  quarterlyGoals: {
    quarter: string;       // "Q1 2026"
    categories: {
      name: string;
      goals: {
        text: string;
        done: boolean;
      }[];
    }[];
  };
  
  // Computed Stats
  stats: {
    daysActive: number;      // Since migration
    lessonsLearned: number;
    totalCost: number;       // From costs API
    successRate: number;     // From performance API
    agentsConfigured: number;
  };
}
```

---

## New Page: /evolution

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🦾 Q Evolution                                                          │
│ Continuous improvement tracking                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐              │
│  │ 📅 Days   │ │ 📚 Lessons│ │ 💰 Spent  │ │ ✅ Success│              │
│  │    5      │ │    15     │ │  $67.20   │ │   94.5%   │              │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘              │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🧠 Deep Knowledge                                      🟡 Learning│   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ✅ Paul Villanueva (Artist) — Q                                  │   │
│  │ 🟡 In House Volumes — Luna                                       │   │
│  │ 🟡 Cohera — Luna                                                 │   │
│  │ 🔴 Ellabelart — Creative Agent                                   │   │
│  │ 🟡 PJ's preferences — Q                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 Agent Ecosystem                                    ✅ Active   │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 9 agents configured: main, creative, growth, research...        │   │
│  │ Coordination: Shared ~/shared/, LESSONS.md symlinked            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🛠️ Tools & Capabilities                               🟡 Building│   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ✅ Voice notes → Text (Whisper)                                  │   │
│  │ ✅ Email/Calendar (gog CLI)                                      │   │
│  │ 🔴 Video editing — Research needed                               │   │
│  │ 🔴 Image generation — Research needed                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✨ The Energy                                          ✅ Vibing │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Aussie mode active • Verification-first • Zero corporate filler │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │ 📚 Recent Lessons           │ │ 📈 Evolution Log                │   │
│  │                             │ │                                 │   │
│  │ • config.patch replaces    │ │ Feb 7: Voice transcription fix │   │
│  │   arrays — include all     │ │ Feb 7: Unstoppable Mode added  │   │
│  │ • Cron wakeMode: use "now" │ │ Feb 6: LESSONS.md created      │   │
│  │ • Verify model before      │ │ Feb 5: 9 agents configured     │   │
│  │   config changes           │ │ Feb 3: Mac Mini migration      │   │
│  │                             │ │                                 │   │
│  │ [View All 15 Lessons →]    │ │ [View Full Log →]              │   │
│  └─────────────────────────────┘ └─────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎯 Q1 2026 Goals                                                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Knowledge: ☐ PV brand ☐ Sydney scene ☐ Production workflow     │   │
│  │ Ecosystem: ☐ Multi-agent handoffs ☐ Performance tracking       │   │
│  │ Tools:     ☐ Content pipeline ☐ Voice both ways               │   │
│  │ Energy:    ☐ Consistent vibe ☐ Zero repeated mistakes          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### New Components
- `src/app/evolution/page.tsx` — Main page
- `src/components/evolution/PillarCard.tsx` — Expandable pillar card
- `src/components/evolution/StatsBar.tsx` — Top stats row
- `src/components/evolution/LessonsCard.tsx` — Recent lessons
- `src/components/evolution/EvolutionLog.tsx` — Timeline of changes
- `src/components/evolution/GoalsCard.tsx` — Quarterly goals checklist

### API Route
- `src/app/api/evolution/route.ts` — Parses markdown files, aggregates data

---

## Markdown Parsing Logic

### EVOLUTION.md Parser
```typescript
// Parse pillar sections between "### 🧠 1." markers
// Extract tables with | Domain | Owner | Status | Notes |
// Parse Evolution Log table
// Parse Quarterly Goals checkboxes
```

### LESSONS.md Parser
```typescript
// Count total lessons (### headings)
// Extract recent 5 lessons
// Group by category if present
```

---

## Navigation Update

Add to sidebar after Performance:
```
Dashboard | Activity | Calendar | Costs | Performance | Evolution | Search
```

Icon: 🦾 or ◈

---

## Build Order

1. **API Route** (30 min) — Parse EVOLUTION.md + LESSONS.md
2. **StatsBar** (15 min) — Top row with computed stats
3. **PillarCard** (30 min) — Expandable cards with status items
4. **LessonsCard + EvolutionLog** (20 min) — Recent activity
5. **GoalsCard** (15 min) — Quarterly goals checklist
6. **Page Assembly** (15 min) — Put it all together
7. **Nav Update** (5 min) — Add to sidebar

Total estimate: ~2 hours

---

## Notes

- Match existing Mission Control design (zinc colors, card style)
- Mobile responsive — stack pillars vertically on small screens
- Error handling — graceful fallback if files don't exist
- Refresh button to re-parse files
- "Last updated" timestamp at bottom

---

*Spec written by Q for Q's own improvement tracking 🦾*
