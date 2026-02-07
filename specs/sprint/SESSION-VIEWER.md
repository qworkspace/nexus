# Session Viewer Dashboard

## Overview
Visual interface to see all active OpenClaw sessions, their status, and recent activity.

## Features

### 1. Session List
- All active sessions (main, cron, spawn)
- Show: name, status, model, last activity, token usage
- Real-time updates

### 2. Session Details
- Click to expand
- Last few messages (summary)
- Token consumption
- Duration

### 3. Session Actions
- View full transcript link
- Kill session (with confirmation)

### 4. Filters
- By type (main, cron, spawn)
- By status (active, completed, error)
- By agent (main, dev, creative, etc.)

## Technical

- Location: `src/app/sessions/page.tsx`
- Use `sessions_list` API equivalent
- Poll every 30 seconds for updates
- Use existing Card, Table components

## API Integration

The page should fetch session data. For now, create mock data structure:

```typescript
interface Session {
  key: string;
  kind: 'main' | 'cron' | 'spawn';
  agent: string;
  model: string;
  status: 'active' | 'completed' | 'error';
  lastActivity: Date;
  tokenUsage: number;
  messages: number;
}
```

## Acceptance Criteria
- [ ] Session list displays correctly
- [ ] Filters work
- [ ] Details expandable
- [ ] Responsive design
- [ ] Build passes: `npm run build`
