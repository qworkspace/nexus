# Mission Control: Transcript Viewer

## Overview

Browse and search through Q's conversation transcripts — see exactly what happened in any session, with full message history, tool calls, and thinking blocks.

**Why this matters:** Full transparency into what Q is doing. Debug issues, review decisions, learn from interactions.

**Estimated build time:** 2 hours

---

## Features

### 1. Session Browser

**List all sessions with search:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📜 TRANSCRIPTS                    🔍 [Search transcripts...] │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All ▼] [Today ▼]                    Sort: [Recent ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📱 Main Session (PJ ↔ Q)                    Feb 7, 2026 │ │
│ │ 156 messages | 82k tokens | 2h 45m duration             │ │
│ │ "Let's focus on Mission Control..."                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 Dev Agent: cryptomon-market              Feb 7, 2026 │ │
│ │ 24 messages | 37k tokens | 14m duration                 │ │
│ │ "Build Market Overview dashboard..."                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⏰ Cron: Afternoon Joke                     Feb 7, 2026 │ │
│ │ 3 messages | 1.2k tokens | 16s duration                 │ │
│ │ "My DAW crashed and I lost 8 hours..."                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Transcript Detail View

**Full conversation with all message types:**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back                    Main Session (Feb 7, 2026)        │
├─────────────────────────────────────────────────────────────┤
│ 156 messages | 82,534 tokens | Model: claude-opus-4-5       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 PJ (16:42)                                           │ │
│ │ Don't wait for my permission, go for it...              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤖 Q (16:42)                                  [thinking] │ │
│ │ ┌─ Thinking ──────────────────────────────────────────┐ │ │
│ │ │ PJ is telling me to stop waiting for permission...  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ LET'S GO! 🔥                                           │ │
│ │                                                         │ │
│ │ ┌─ Tool Call: sessions_spawn ─────────────────────────┐ │ │
│ │ │ agentId: "dev"                                      │ │ │
│ │ │ task: "Build the Mission Control Live..."          │ │ │
│ │ │ label: "mission-control-live-dashboard"            │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─ Tool Result ───────────────────────────────────────┐ │ │
│ │ │ status: "accepted"                                  │ │ │
│ │ │ childSessionKey: "agent:dev:subagent:48e53cdd..."  │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Message Types Display

**Different styling for each type:**

| Type | Display |
|------|---------|
| User message | Blue background, left-aligned |
| Assistant message | Dark background, full width |
| Thinking block | Collapsible, gray italic |
| Tool call | Code block with syntax highlighting |
| Tool result | Code block, collapsible if long |
| System message | Yellow background, italic |
| Error | Red background |

### 4. Search & Filter

**Search across all transcripts:**
- Full-text search in messages
- Filter by session type (main, cron, spawn)
- Filter by date range
- Filter by agent
- Filter by model

**Search results:**
```
┌─────────────────────────────────────────────────────────────┐
│ Search: "cron hotfix"                         3 results     │
├─────────────────────────────────────────────────────────────┤
│ Main Session (Feb 7) — "Applied cron hotfix for Issue..."  │
│ Main Session (Feb 7) — "The cron's got jokes..."           │
│ Cron Monitor (Feb 7) — "Checking cron failures..."         │
└─────────────────────────────────────────────────────────────┘
```

### 5. Export Options

- Export as Markdown
- Export as JSON
- Copy message to clipboard
- Share link to specific message (future)

---

## Technical Implementation

### Data Source

Transcripts are stored as JSONL files:
```
~/.openclaw/agents/main/sessions/*.jsonl
~/.openclaw/agents/dev/sessions/*.jsonl
```

**JSONL Format:**
```json
{"role":"user","content":"Hello","timestamp":1234567890}
{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"text","text":"Hi!"}],"timestamp":1234567891}
```

### API Routes

```
src/app/api/transcripts/
├── route.ts              # List all transcripts
├── [sessionId]/route.ts  # Get single transcript
└── search/route.ts       # Search across transcripts
```

### File Structure

```
src/app/transcripts/
├── page.tsx              # Transcript browser
├── [sessionId]/page.tsx  # Single transcript view
└── components/
    ├── TranscriptList.tsx
    ├── TranscriptViewer.tsx
    ├── MessageBubble.tsx
    ├── ThinkingBlock.tsx
    ├── ToolCallBlock.tsx
    └── SearchResults.tsx
```

### Data Types

```typescript
interface TranscriptMeta {
  sessionId: string;
  sessionKey: string;
  kind: 'main' | 'cron' | 'spawn';
  agent: string;
  model: string;
  messageCount: number;
  tokenCount: number;
  duration: number;
  startedAt: Date;
  lastMessage: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp: number;
  usage?: TokenUsage;
}

interface ContentBlock {
  type: 'text' | 'thinking' | 'toolCall' | 'toolResult';
  // ... type-specific fields
}
```

---

## Acceptance Criteria

### Must Have
- [ ] /transcripts page lists all sessions
- [ ] Click session to view full transcript
- [ ] User/assistant messages display correctly
- [ ] Thinking blocks are collapsible
- [ ] Tool calls show with syntax highlighting
- [ ] Navigation item added
- [ ] Build passes: `npm run build`

### Should Have
- [ ] Search within transcript
- [ ] Filter by session type
- [ ] Filter by date
- [ ] Export as Markdown

### Nice to Have
- [ ] Global search across all transcripts
- [ ] Copy message button
- [ ] Token usage per message
- [ ] Jump to timestamp

---

## Design Notes

- Use monospace font for code/tool blocks
- Thinking blocks: gray background, italic
- Tool calls: dark code block with language hint
- User messages: subtle blue tint
- Keep it readable — not too dense
