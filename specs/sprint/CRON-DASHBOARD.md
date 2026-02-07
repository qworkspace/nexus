# Cron Jobs Dashboard

## Overview
Visual management interface for OpenClaw cron jobs — see all jobs, their schedules, status, and history.

## Features

### 1. Cron Job List
- All jobs with name, schedule (human readable), next run, last status
- Color coded: green (ok), red (error), gray (never run)
- Sorted by next run time

### 2. Schedule Visualization
- Timeline view showing when jobs fire
- 24-hour view with job markers
- Identify clustering/gaps

### 3. Job Details Panel
- Full payload preview
- Run history (last 5 runs)
- Duration stats
- Error messages if any

### 4. Quick Actions
- Run now (manual trigger)
- Enable/disable toggle
- Edit schedule (future)

## Technical

- Location: `src/app/crons/page.tsx`
- Components: `CronList.tsx`, `CronTimeline.tsx`, `CronDetails.tsx`
- Use cron-parser for human-readable schedules
- Mock data structure matching OpenClaw cron format

## Data Structure

```typescript
interface CronJob {
  id: string;
  name: string;
  schedule: { kind: string; expr: string; tz: string };
  enabled: boolean;
  lastStatus: 'ok' | 'error' | null;
  lastRunAt: Date | null;
  nextRunAt: Date;
  payload: { kind: string; message: string };
}
```

## Acceptance Criteria
- [ ] Job list displays all crons
- [ ] Human-readable schedules
- [ ] Status indicators work
- [ ] Timeline visualization
- [ ] Build passes: `npm run build`
