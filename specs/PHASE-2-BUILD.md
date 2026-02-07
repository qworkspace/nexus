# Mission Control Phase 2 — Build Spec

**Date:** 2026-02-07  
**Features:** Token Cost Tracking, Agent Performance Dashboard

---

## Feature 15: Token Cost Tracking

### Purpose
Track and display the cost of each activity (input/output tokens, total cost).

### Database Changes
```prisma
model Activity {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  type        String
  action      String
  title       String
  description String?
  metadata    Json?
  duration    Int?
  status      String   @default("success")
  
  // NEW: Cost tracking fields
  tokensIn    Int?     // Input tokens
  tokensOut   Int?     // Output tokens  
  tokensCacheRead  Int?
  tokensCacheWrite Int?
  cost        Float?   // Total cost in USD
  model       String?  // Model used (e.g., "claude-opus-4-5")
}
```

### API Changes
Update POST /api/activity to accept cost data:
```typescript
interface ActivityInput {
  type: string;
  action: string;
  title: string;
  description?: string;
  status?: string;
  // NEW
  tokensIn?: number;
  tokensOut?: number;
  tokensCacheRead?: number;
  tokensCacheWrite?: number;
  cost?: number;
  model?: string;
}
```

### New API Route: GET /api/costs
```typescript
// Returns cost summary
interface CostSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byModel: { model: string; cost: number; count: number }[];
  byDay: { date: string; cost: number }[];
}
```

### UI Changes

#### Dashboard Enhancement
Add "Cost Summary" card:
```
┌─────────────────────────────┐
│ 💰 Token Costs              │
│                             │
│ Today:      $2.34           │
│ This Week:  $18.50          │
│ This Month: $67.20          │
│                             │
│ [View Details →]            │
└─────────────────────────────┘
```

#### New Page: /costs
- Daily cost chart (bar chart)
- Cost breakdown by model
- Cost breakdown by activity type
- Top 10 most expensive activities

#### Activity Cards
Show cost badge on each activity:
```
┌────────────────────────────────────────┐
│ ✅ Fixed cron jobs              $0.56  │
│ task • 2 hours ago • claude-opus-4-5   │
│ Tokens: 8k in / 2k out                 │
└────────────────────────────────────────┘
```

---

## Feature 17: Agent Performance Dashboard

### Purpose
Track agent success rates, response times, and error patterns.

### Database Changes
Add to Activity model or create new table:
```prisma
model AgentMetrics {
  id            String   @id @default(cuid())
  date          DateTime @default(now()) // Daily aggregation
  agentId       String   @default("main")
  
  // Counts
  totalRuns     Int      @default(0)
  successCount  Int      @default(0)
  errorCount    Int      @default(0)
  
  // Timing
  avgDurationMs Int?
  maxDurationMs Int?
  minDurationMs Int?
  
  // Costs
  totalCost     Float    @default(0)
  totalTokensIn Int      @default(0)
  totalTokensOut Int     @default(0)
  
  @@unique([date, agentId])
}
```

### New API Route: GET /api/performance
```typescript
interface PerformanceData {
  summary: {
    successRate: number;      // e.g., 94.5
    avgResponseTime: number;  // ms
    totalTasks: number;
    errorsToday: number;
  };
  daily: {
    date: string;
    successRate: number;
    avgDuration: number;
    taskCount: number;
  }[];
  errorPatterns: {
    message: string;
    count: number;
    lastOccurred: string;
  }[];
  topSlowTasks: {
    title: string;
    duration: number;
    timestamp: string;
  }[];
}
```

### New Page: /performance
Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Agent Performance                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Success  │ │ Avg Time │ │ Tasks    │ │ Errors   │   │
│  │  94.5%   │ │  2.3s    │ │   847    │ │    12    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  [Success Rate Over Time - Line Chart]                  │
│                                                          │
│  ┌─────────────────────┐ ┌─────────────────────┐        │
│  │ Error Patterns      │ │ Slowest Tasks       │        │
│  │ • API timeout (5)   │ │ • Build CryptoMon   │        │
│  │ • Rate limit (3)    │ │ • Morning Brief     │        │
│  │ • Network err (2)   │ │ • Security Audit    │        │
│  └─────────────────────┘ └─────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Components
- `src/components/performance/PerformanceStats.tsx`
- `src/components/performance/SuccessRateChart.tsx`
- `src/components/performance/ErrorPatterns.tsx`
- `src/components/performance/SlowTasks.tsx`

### Navigation Update
Add to sidebar: Dashboard | Activity | Calendar | Search | **Costs** | **Performance**

---

## Build Order

1. **Token Cost Tracking** (1.5h)
   - Database migration
   - API updates
   - Dashboard card
   - /costs page

2. **Agent Performance Dashboard** (1.5h)
   - Database schema
   - API endpoint
   - /performance page
   - Charts and stats

Total estimate: ~3 hours

---

## Notes

- Use Recharts for charts (already in project or add)
- Match existing zinc color scheme
- Cards should be consistent with dashboard style
- Mobile responsive grid layout

