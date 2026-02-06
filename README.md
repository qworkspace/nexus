# Mission Control

Q's activity dashboard for PJ. Track everything Q does in one place.

## Features

### 📊 Dashboard
- Overview stats (total activities, today's count, errors)
- Recent activity preview
- Quick navigation

### ◎ Activity Feed
- Complete history of Q's actions
- Filter by type (task, message, cron, file, search, spawn)
- Filter by status (success, error, pending)
- Date range filtering
- Expandable cards with metadata

### ◫ Calendar View
- Weekly calendar of scheduled cron jobs
- Color-coded by job type
- Click for job details
- Week navigation

### ⌕ Global Search
- Search across memory, docs, projects, and activity
- Category filtering
- Recent searches
- Highlighted matches

### ⌘K Command Palette
- Quick navigation anywhere
- Keyboard-first workflow

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite via Prisma
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** Unicode symbols (no external deps)

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/activity` | GET | List activities with filters |
| `/api/activity` | POST | Log new activity |
| `/api/calendar` | GET | Get cron jobs for date range |
| `/api/search` | GET | Search indexed content |
| `/api/index` | POST | Trigger reindexing |

## Logging Activity

```bash
curl -X POST http://localhost:3000/api/activity \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task",
    "action": "completed",
    "title": "Built Mission Control",
    "description": "Created dashboard for PJ",
    "status": "success"
  }'
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Dashboard
│   ├── activity/          # Activity feed
│   ├── calendar/          # Calendar view
│   ├── search/            # Global search
│   └── api/               # API routes
├── components/
│   ├── activity-card.tsx
│   ├── calendar-grid.tsx
│   ├── search-results.tsx
│   ├── command-palette.tsx
│   ├── sidebar.tsx
│   └── ui/                # shadcn components
└── lib/
    ├── db.ts              # Prisma client
    ├── cron-parser.ts     # Cron expression parser
    └── search-index.ts    # File indexer
```

---

Built with 💜 for PJ by Q
