# Q Evolution Dashboard — Comprehensive Spec

## Purpose

Track the AI hivemind's growth over time. Answer the question: **"Is Q getting smarter?"**

This isn't vanity metrics — it's operational intelligence. We want to know if the system is learning, preventing errors, making better decisions, and becoming more efficient.

---

## Core Metrics

### 1. 🧠 Intelligence Growth

**Lessons Learned**
- Total lessons in LESSONS.md (count)
- Lessons added this week/month
- Categories breakdown (Config, API, Communication, Verification, etc.)
- Most recent 5 lessons with dates
- Click to expand full lesson text

**Skills Acquired**
- Total skills available vs actively used
- New skills added (timeline)
- Skill usage frequency

**Knowledge Base Growth**
- MEMORY.md size over time
- Daily memory files count
- Topics/entities mentioned (extracted keywords)

---

### 2. ✅ Task Success Rate

**Overall Success**
- Tasks completed successfully vs failed (pie chart)
- Success rate trend over time (line chart)
- Rolling 7-day / 30-day success rate

**By Task Type**
- Dev builds: success/fail ratio
- Cron jobs: fired/missed/failed
- Research tasks: completed
- Message responses: delivered

**Error Tracking**
- Errors today / this week / this month
- Error categories (timeout, rate limit, code error, etc.)
- Repeat errors (same error multiple times = learning failure)
- Time to resolution

---

### 3. 🎯 Decision Quality

**Verification Rate**
- Claims made with source verification vs without
- "Should work" vs "Verified: works because X" ratio
- Improvement trend over time

**Autonomy Score**
- Tasks completed without asking PJ for help
- Decisions made independently
- Escalations to PJ (should decrease over time)

**Correction Rate**
- Times PJ corrected Q
- Same correction repeated (bad)
- Correction → Lesson added (good)

---

### 4. 💰 Model Efficiency

**Token Usage**
- Daily/weekly/monthly token consumption
- Breakdown by model (Opus, Sonnet, GLM, Qwen)
- Cost per successful task
- Trend: are we getting more efficient?

**Model Distribution**
- % of work on each model
- Opus (expensive, high-value conversations)
- Sonnet (subagents, QA)
- GLM/Qwen (dev work)

**Efficiency Metrics**
- Tokens per completed task (should decrease)
- Cost per feature shipped
- Context utilization (are we hitting compaction often?)

---

### 5. 🌟 Vibrational Alignment

**Communication Quality**
- Response time to PJ messages
- Message length trends (concise = good)
- Proactive updates sent
- Heartbeat productivity (useful work vs HEARTBEAT_OK)

**System Health**
- Uptime (gateway running)
- Cron reliability (% fired on time)
- Memory consolidation (daily → MEMORY.md)
- Backup success rate

---

## Data Sources

| Metric | Source |
|--------|--------|
| Lessons count | Parse `LESSONS.md` |
| Memory growth | File size of `MEMORY.md` + `memory/*.md` |
| Task success | Parse session transcripts for outcomes |
| Errors | Parse transcripts for error messages |
| Token usage | OpenClaw session data (usage field) |
| Cron reliability | Cron runs history (cron tool) |
| Corrections | Parse transcripts for PJ corrections |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Q Evolution Dashboard                           [Refresh]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 📚 17        │ │ ✅ 94.2%     │ │ 💰 $12.34    │        │
│  │ Lessons      │ │ Success Rate │ │ Cost Today   │        │
│  │ +3 this week │ │ ↑ 2.1%       │ │ ↓ 15%        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Intelligence Growth                    [7d][30d][All]│   │
│  │ [Line chart: lessons, memory size, skills over time]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐ ┌────────────────────────────┐   │
│  │ Recent Lessons       │ │ Task Success by Type       │   │
│  │ ┌─────────────────┐  │ │ [Stacked bar chart]        │   │
│  │ │ • Feature value │  │ │ Dev: ████████░░ 85%        │   │
│  │ │ • Model slots   │  │ │ Cron: █████████░ 95%       │   │
│  │ │ • Verification  │  │ │ Research: ██████░░░ 70%    │   │
│  │ └─────────────────┘  │ └────────────────────────────┘   │
│  └──────────────────────┘                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Model Efficiency                                     │   │
│  │ [Pie: Opus 15% | Sonnet 25% | GLM 40% | Qwen 20%]   │   │
│  │ Tokens/task: 12.4k (↓8% from last week)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐ ┌────────────────────────────┐   │
│  │ Autonomy Score       │ │ Correction Tracker         │   │
│  │ ████████████░░ 87%   │ │ This week: 3 corrections   │   │
│  │ ↑ from 72% last mo   │ │ → 3 lessons added ✓        │   │
│  └──────────────────────┘ └────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

**Phase 1 — Core Metrics (build first)**
1. Lessons count + recent lessons display
2. Token usage from session data
3. Error count from transcripts

**Phase 2 — Success Tracking**
4. Task success/fail parsing
5. Cron reliability from runs history
6. Model distribution pie chart

**Phase 3 — Advanced**
7. Correction tracking (NLP on transcripts)
8. Autonomy score calculation
9. Trend charts over time

---

## Key Question This Answers

> "Is Q becoming a better orchestrator, or just burning tokens?"

If lessons increase, errors decrease, success rate climbs, and cost-per-task drops — Q is evolving.

If not, we have a problem to solve.

---

## Notes

- All data should be parseable from existing files/transcripts
- No new logging infrastructure needed for Phase 1
- Phase 2+ may need structured logging
- Update MEMORY.md with evolution milestones

