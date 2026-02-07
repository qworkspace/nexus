# Cost Tracking Dashboard

## Overview
Track API costs across all agents and sessions.

## Features

### 1. Daily Cost Summary
- Total cost today
- Cost by agent
- Cost by model
- Comparison to yesterday

### 2. Cost Breakdown Chart
- Pie chart by agent
- Line chart over time (7 days)
- Bar chart by model

### 3. Budget Alerts
- Set daily/weekly budget
- Alert when approaching limit
- Auto-switch to cheaper model option

### 4. Cost Projections
- "At this rate, monthly cost = $X"
- Compare Opus vs Sonnet vs GLM costs
- ROI tracking (value delivered vs cost)

## Technical

- Location: `src/app/costs/page.tsx`
- Components: `CostSummary.tsx`, `CostChart.tsx`, `BudgetAlert.tsx`
- Data: Parse from session token usage

## Cost Calculation

```typescript
const MODEL_COSTS = {
  'claude-opus-4-5': { input: 0.015, output: 0.075 },
  'claude-sonnet-4-5': { input: 0.003, output: 0.015 },
  'glm-4.7': { input: 0, output: 0 }, // Flat rate
};

const calculateCost = (tokens: TokenUsage, model: string) => {
  const rates = MODEL_COSTS[model];
  return (tokens.input * rates.input + tokens.output * rates.output) / 1000;
};
```

## Acceptance Criteria
- [ ] Daily cost displays
- [ ] Charts work
- [ ] Budget input functional
- [ ] Projections calculate
- [ ] Build passes: `npm run build`
