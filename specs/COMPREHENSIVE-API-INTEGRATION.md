# Mission Control: OpenClaw API Integration

## Overview

Connect Mission Control to actual OpenClaw data — real sessions, real crons, real costs. Move from mock data to live data.

**Why this matters:** Mock data is good for building UI, but real value comes from real data. This makes Mission Control actually useful.

**Estimated build time:** 2-3 hours

---

## API Endpoints to Integrate

### 1. Sessions Data

**Source:** OpenClaw `sessions_list` equivalent

**Endpoint:** `GET /api/openclaw/sessions`

**Response:**
```typescript
interface SessionsResponse {
  count: number;
  sessions: {
    key: string;
    kind: 'main' | 'cron' | 'spawn' | 'other';
    channel: string;
    displayName?: string;
    model: string;
    totalTokens: number;
    updatedAt: number; // timestamp
    sessionId: string;
  }[];
}
```

**Implementation:**
```typescript
// src/app/api/openclaw/sessions/route.ts
export async function GET() {
  // Option 1: Call OpenClaw CLI
  const result = await exec('openclaw sessions list --json');
  return Response.json(JSON.parse(result));
  
  // Option 2: Read from OpenClaw state files
  // const sessionsPath = '~/.openclaw/agents/main/sessions/';
  
  // Option 3: Proxy to OpenClaw gateway
  // const response = await fetch('http://localhost:18789/api/sessions');
}
```

### 2. Cron Jobs Data

**Source:** OpenClaw `cron list` equivalent

**Endpoint:** `GET /api/openclaw/crons`

**Response:**
```typescript
interface CronsResponse {
  jobs: {
    id: string;
    name: string;
    enabled: boolean;
    schedule: {
      kind: string;
      expr: string;
      tz: string;
    };
    state: {
      nextRunAtMs: number;
      lastRunAtMs?: number;
      lastStatus?: 'ok' | 'error';
      lastDurationMs?: number;
    };
  }[];
}
```

### 3. Cron Run History

**Endpoint:** `GET /api/openclaw/crons/[id]/runs`

**Response:**
```typescript
interface CronRunsResponse {
  entries: {
    ts: number;
    jobId: string;
    action: 'finished';
    status: 'ok' | 'error';
    summary?: string;
    runAtMs: number;
    durationMs: number;
    nextRunAtMs?: number;
  }[];
}
```

### 4. Session Status (for costs)

**Endpoint:** `GET /api/openclaw/status`

**Response:**
```typescript
interface StatusResponse {
  session: {
    model: string;
    totalTokens: number;
    contextTokens: number;
    cost?: {
      input: number;
      output: number;
      total: number;
    };
  };
}
```

---

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Mission        │────▶│  Next.js API    │────▶│  OpenClaw       │
│  Control UI     │     │  Routes         │     │  Gateway/CLI    │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     React              /api/openclaw/*           localhost:18789
     SWR/React Query    Proxy + Transform         or CLI commands
```

---

## Implementation Plan

### Phase 1: API Routes (Backend)

Create Next.js API routes that proxy to OpenClaw:

```
src/app/api/openclaw/
├── sessions/route.ts      # Get active sessions
├── crons/
│   ├── route.ts          # List all crons
│   └── [id]/
│       └── runs/route.ts # Get cron run history
├── status/route.ts       # Get gateway status
└── spawn/route.ts        # Spawn new agent (POST)
```

### Phase 2: Data Fetching Hooks

Create React hooks for fetching data:

```typescript
// src/hooks/useOpenClawSessions.ts
export function useOpenClawSessions() {
  return useSWR('/api/openclaw/sessions', fetcher, {
    refreshInterval: 10000, // 10 seconds
  });
}

// src/hooks/useOpenClawCrons.ts
export function useOpenClawCrons() {
  return useSWR('/api/openclaw/crons', fetcher, {
    refreshInterval: 30000, // 30 seconds
  });
}
```

### Phase 3: Update Components

Replace mock data with real data:

```typescript
// Before (mock)
const sessions = mockSessions;

// After (real)
const { data: sessions, error, isLoading } = useOpenClawSessions();

if (isLoading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
```

---

## CLI Command Reference

Commands that can provide data:

```bash
# List sessions
openclaw sessions list --json

# List crons
openclaw cron list --json

# Get cron runs
openclaw cron runs <job-id> --json

# Check status
openclaw status --json

# Gateway status
openclaw gateway status --json
```

---

## Error Handling

### Gateway Not Running

```typescript
if (error?.code === 'ECONNREFUSED') {
  return {
    error: 'OpenClaw gateway not running',
    suggestion: 'Run: openclaw gateway start',
  };
}
```

### Permission Errors

```typescript
if (error?.message?.includes('forbidden')) {
  return {
    error: 'Permission denied',
    suggestion: 'Check OpenClaw configuration',
  };
}
```

### Timeout

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
} catch (e) {
  if (e.name === 'AbortError') {
    return { error: 'Request timed out' };
  }
}
```

---

## Security Considerations

1. **Local only:** API routes should only work on localhost
2. **No secrets exposed:** Don't send API keys to client
3. **Rate limiting:** Don't spam OpenClaw gateway
4. **Validation:** Sanitize all inputs

```typescript
// Ensure local-only access
export async function GET(req: Request) {
  const host = req.headers.get('host');
  if (!host?.startsWith('localhost')) {
    return Response.json({ error: 'Local access only' }, { status: 403 });
  }
  // ...
}
```

---

## Files to Create

```
src/
├── app/api/openclaw/
│   ├── sessions/route.ts
│   ├── crons/route.ts
│   ├── crons/[id]/runs/route.ts
│   ├── status/route.ts
│   └── spawn/route.ts
├── hooks/
│   ├── useOpenClawSessions.ts
│   ├── useOpenClawCrons.ts
│   └── useOpenClawStatus.ts
└── lib/
    └── openclaw-client.ts  # Shared client utilities
```

---

## Acceptance Criteria

### Must Have
- [ ] /api/openclaw/sessions returns session data
- [ ] /api/openclaw/crons returns cron list
- [ ] useOpenClawSessions hook works
- [ ] useOpenClawCrons hook works
- [ ] Live Dashboard uses real session data
- [ ] Cron page uses real cron data
- [ ] Build passes: `npm run build`

### Should Have
- [ ] Error states for gateway offline
- [ ] Loading states while fetching
- [ ] Auto-refresh working
- [ ] Cron run history works

### Nice to Have
- [ ] Spawn agent from UI
- [ ] Kill session from UI
- [ ] Run cron manually from UI

---

## Testing

1. **With gateway running:** Full integration test
2. **Without gateway:** Verify error handling
3. **With mock:** Fallback to mock data for demo

```typescript
// Fallback to mock if gateway unavailable
const { data, error } = useOpenClawSessions();

if (error && process.env.NODE_ENV === 'development') {
  return mockSessions; // Demo mode
}
```
