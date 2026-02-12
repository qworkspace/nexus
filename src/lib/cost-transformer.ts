import { CliResponse } from './cost-data-service';

// Type definitions from API contract
export interface DailyCostSummary {
  date: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
}

export interface ModelBreakdown {
  model: string;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
}

export interface TypeBreakdown {
  input: { tokens: number; cost: number };
  output: { tokens: number; cost: number };
  cacheRead: { tokens: number; cost: number };
  cacheWrite: { tokens: number; cost: number };
}

export interface TopExpensiveItem {
  date: string;
  cost: number;
  tokens: number;
}

export interface TransformedCostData {
  source: 'openclaw' | 'mock';
  today: DailyCostSummary;
  thisWeek: DailyCostSummary;
  thisMonth: DailyCostSummary;
  byModel: ModelBreakdown[];
  byDay: DailyCostSummary[];
  byType: TypeBreakdown;
  topExpensive: TopExpensiveItem[];
}

/**
 * Transform CLI response into API contract shape
 */
export function transformCostData(cliData: CliResponse): TransformedCostData {
  const { daily, totals } = cliData;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate start of week (Monday)
  const weekStart = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(today.getDate() - diff);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Calculate start of month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // Filter and aggregate by period
  const todayData = daily.find(d => d.date === todayStr);
  const thisWeekData = daily.filter(d => d.date >= weekStartStr);
  const thisMonthData = daily.filter(d => d.date >= monthStartStr);

  // Summarize period data
  const sumEntries = (entries: typeof daily) => ({
    date: entries[entries.length - 1]?.date || '',
    input: entries.reduce((sum, e) => sum + e.input, 0),
    output: entries.reduce((sum, e) => sum + e.output, 0),
    cacheRead: entries.reduce((sum, e) => sum + e.cacheRead, 0),
    cacheWrite: entries.reduce((sum, e) => sum + e.cacheWrite, 0),
    totalTokens: entries.reduce((sum, e) => sum + e.totalTokens, 0),
    totalCost: entries.reduce((sum, e) => sum + e.totalCost, 0),
    inputCost: entries.reduce((sum, e) => sum + e.inputCost, 0),
    outputCost: entries.reduce((sum, e) => sum + e.outputCost, 0),
    cacheReadCost: entries.reduce((sum, e) => sum + e.cacheReadCost, 0),
    cacheWriteCost: entries.reduce((sum, e) => sum + e.cacheWriteCost, 0),
  });

  const todaySummary: DailyCostSummary = todayData || createEmptySummary(todayStr);
  const thisWeekSummary: DailyCostSummary = sumEntries(thisWeekData);
  const thisMonthSummary: DailyCostSummary = sumEntries(thisMonthData);

  // Top expensive days (last 7 days, sorted by cost desc)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const recentData = daily
    .filter(d => new Date(d.date) >= sevenDaysAgo)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  const topExpensive: TopExpensiveItem[] = recentData.map(d => ({
    date: d.date,
    cost: d.totalCost,
    tokens: d.totalTokens
  }));

  return {
    source: 'openclaw',
    today: todaySummary,
    thisWeek: thisWeekSummary,
    thisMonth: thisMonthSummary,
    byModel: [], // CLI doesn't provide model breakdown; return empty
    byDay: daily.map(d => ({
      date: d.date,
      input: d.input,
      output: d.output,
      cacheRead: d.cacheRead,
      cacheWrite: d.cacheWrite,
      totalTokens: d.totalTokens,
      totalCost: d.totalCost,
      inputCost: d.inputCost,
      outputCost: d.outputCost,
      cacheReadCost: d.cacheReadCost,
      cacheWriteCost: d.cacheWriteCost
    })),
    byType: {
      input: {
        tokens: totals.input,
        cost: totals.inputCost
      },
      output: {
        tokens: totals.output,
        cost: totals.outputCost
      },
      cacheRead: {
        tokens: totals.cacheRead,
        cost: totals.cacheReadCost
      },
      cacheWrite: {
        tokens: totals.cacheWrite,
        cost: totals.cacheWriteCost
      }
    },
    topExpensive
  };
}

function createEmptySummary(dateStr: string): DailyCostSummary {
  return {
    date: dateStr,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0
  };
}
