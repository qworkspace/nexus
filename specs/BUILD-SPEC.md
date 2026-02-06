# Mission Control Dashboard — Build Spec

**Project:** Q's Mission Control for PJ  
**Framework:** Next.js 14 (App Router)  
**Database:** SQLite via Prisma (zero external deps, file-based, portable)  
**Styling:** Tailwind CSS + shadcn/ui (consistent with CryptoMon)

---

## Overview

A dashboard for PJ to see everything Q does — activity history, scheduled tasks, and searchable workspace.

---

## Module 1: Activity Feed

### Purpose
Record and display EVERY action Q takes for PJ.

### Data Model
```prisma
model Activity {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  type        String   // "task", "message", "cron", "file", "search", "spawn"
  action      String   // "completed", "started", "failed", "sent", "created", "edited"
  title       String   // Short description
  description String?  // Detailed description
  metadata    Json?    // Extra context (file paths, session IDs, etc.)
  duration    Int?     // Duration in ms if applicable
  status      String   @default("success") // "success", "error", "pending"
}
```

### Features
- Real-time feed (newest first)
- Filter by type (tasks, messages, crons, files)
- Filter by date range
- Click to expand details
- Infinite scroll / pagination

### UI
- Card-based timeline
- Color-coded by type
- Relative timestamps ("2 hours ago")
- Status indicators (✅ ❌ ⏳)

---

## Module 2: Calendar View

### Purpose
Show all scheduled cron jobs in a weekly calendar format.

### Data Source
- Pull from OpenClaw cron API (`cron list`)
- Parse schedule expressions to display times

### Features
- Weekly view (Mon-Sun)
- Visual blocks for each scheduled job
- Color-coded by job type
- Click to see job details
- Navigate between weeks
- Today indicator

### UI
- Grid layout (7 columns)
- Time slots on Y-axis (or all-day events)
- Hover for quick preview
- Modal for full details

---

## Module 3: Global Search

### Purpose
Search across ALL workspace content — memory, documents, tasks, activity.

### Searchable Content
1. **Memory files** (`~/.openclaw/workspace/memory/*.md`, `MEMORY.md`)
2. **Workspace docs** (`~/.openclaw/workspace/docs/*.md`)
3. **Project files** (`~/projects/**/README.md`, `*.md`)
4. **Activity history** (from SQLite)
5. **Cron jobs** (names, descriptions)

### Features
- Instant search (debounced)
- Result categorization (Memory, Docs, Activity, Tasks)
- Snippet previews with highlighted matches
- Click to open/view full content
- Recent searches

### Implementation
- Index markdown files on startup + file watch
- SQLite FTS5 for full-text search
- API route for search queries

---

## Tech Stack Details

### Database
```
SQLite + Prisma
- File: ~/projects/mission-control/data/mission-control.db
- Migrations via Prisma
- FTS5 for full-text search
```

### API Routes
```
POST /api/activity      — Log new activity
GET  /api/activity      — List activities (with filters)
GET  /api/calendar      — Get cron jobs for date range
GET  /api/search        — Global search
POST /api/index         — Trigger reindex
```

### File Structure
```
~/projects/mission-control/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard home
│   │   ├── activity/
│   │   │   └── page.tsx       # Activity feed
│   │   ├── calendar/
│   │   │   └── page.tsx       # Calendar view
│   │   ├── search/
│   │   │   └── page.tsx       # Global search
│   │   └── api/
│   │       ├── activity/
│   │       ├── calendar/
│   │       └── search/
│   ├── components/
│   │   ├── ActivityCard.tsx
│   │   ├── CalendarGrid.tsx
│   │   ├── SearchResults.tsx
│   │   └── ui/               # shadcn components
│   └── lib/
│       ├── db.ts             # Prisma client
│       ├── search-index.ts   # File indexing
│       └── cron-parser.ts    # Parse cron expressions
├── data/
│   └── mission-control.db
└── package.json
```

---

## Design

### Style
- Clean, minimal (Apple aesthetic like CryptoMon)
- Light mode
- Zinc color palette
- SF Pro / Inter typography

### Layout
- Sidebar navigation (Activity, Calendar, Search)
- Top bar with global search shortcut (Cmd+K)
- Main content area

---

## Build Order

1. **Phase 1: Foundation** (30 min)
   - Next.js setup
   - Prisma + SQLite
   - shadcn/ui components
   - Basic layout

2. **Phase 2: Activity Feed** (1 hr)
   - Database schema
   - API routes
   - Activity list UI
   - Filters

3. **Phase 3: Calendar View** (1 hr)
   - Cron parser
   - Weekly grid component
   - Job details modal

4. **Phase 4: Global Search** (1 hr)
   - File indexer
   - FTS5 setup
   - Search UI
   - Result categories

5. **Phase 5: Polish** (30 min)
   - Responsive design
   - Loading states
   - Error handling
   - Keyboard shortcuts

---

## Integration with Q

After build, Q will:
1. Log activities via POST /api/activity
2. Activity types: task_complete, message_sent, cron_run, file_created, search_performed, agent_spawned

---

## Success Criteria

- [ ] Activity feed shows chronological history
- [ ] Calendar displays all cron jobs correctly
- [ ] Search returns relevant results from all sources
- [ ] UI is clean and responsive
- [ ] Build passes with no errors
