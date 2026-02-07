# Agent Directory

## Overview
Visual directory of all configured agents with their details and status.

## Features

### 1. Agent Cards
- Each agent as a card
- Shows: name, emoji, model, description
- Status indicator (online/offline)

### 2. Agent Details
- Click to expand
- Full config preview
- Recent activity summary
- Token usage (last 24h)

### 3. Quick Actions
- Spawn task button
- View workspace link
- Edit config (future)

### 4. Agent Stats
- Total agents count
- Active now
- Tasks completed today

## Technical

- Location: `src/app/agents/page.tsx`
- Components: `AgentCard.tsx`, `AgentDetails.tsx`
- Read from agent configs or mock data

## Agent Data Structure

```typescript
interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  description: string;
  workspace: string;
  status: 'online' | 'offline' | 'busy';
  tasksToday: number;
  tokensUsed: number;
}

// Our agents
const agents = [
  { id: 'main', name: 'Q', emoji: '🦾', model: 'opus', description: 'Primary assistant' },
  { id: 'dev', name: 'Dev', emoji: '💻', model: 'glm-4.7', description: 'Code builder' },
  { id: 'creative', name: 'Creative', emoji: '🎨', model: 'sonnet', description: 'Brand & content' },
  // ...
];
```

## Acceptance Criteria
- [ ] All agents display as cards
- [ ] Details expandable
- [ ] Status indicators work
- [ ] Stats summary at top
- [ ] Build passes: `npm run build`
