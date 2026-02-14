/**
 * Token Usage Dashboard Types
 * Shared types for API response and components
 */

export interface TokenUsageResponse {
  // Summary metrics
  today: TokenPeriodSummary;
  yesterday: TokenPeriodSummary;
  thisWeek: TokenPeriodSummary;
  thisMonth: TokenPeriodSummary;

  // Time series data
  byDay: DailyTokenUsage[];

  // Breakdowns
  byModel: ModelBreakdown[];
  byProvider: ProviderBreakdown[];
  bySessionType: SessionTypeBreakdown[];

  // Top consumers
  topConsumers: TokenConsumer[];

  // Anomaly detection
  alerts: TokenAlert[];

  // Cache metadata
  cached: boolean;
  cacheTime?: string;
}

export interface TokenPeriodSummary {
  date: string; // ISO date (YYYY-MM-DD)
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

export interface DailyTokenUsage {
  date: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
}

export interface ModelBreakdown {
  model: string;
  provider: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  avgCostPer1kTokens: number;
}

export interface ProviderBreakdown {
  provider: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

export interface SessionTypeBreakdown {
  type: 'main' | 'cron' | 'subagent';
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}

export interface TokenConsumer {
  sessionId: string;
  agentType: string;
  sessionType: string;
  label: string;
  totalTokens: number;
  totalCost: number;
  timestamp: string;
}

export interface TokenAlert {
  type: 'spike' | 'high_daily' | 'unusual_model';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  date: string;
}

// Raw message structure from session transcripts
export interface SessionMessage {
  type?: string;
  id?: string;
  parentId?: string;
  timestamp?: string;
  message?: {
    role?: string;
    usage?: {
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
      totalTokens?: number;
      cost?: {
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
        total?: number;
      };
    };
    provider?: string;
    model?: string;
  };
}

// Aggregated data structure (used by aggregator and alerts)
export interface DailyAggregation {
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
  totalRequests: number;
}

export interface ModelAggregation {
  model: string;
  provider: string;
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
  requestCount: number;
}

export interface ProviderAggregation {
  provider: string;
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
  requestCount: number;
}

export interface SessionTypeAggregation {
  type: 'main' | 'cron' | 'subagent';
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
  requestCount: number;
}

export interface AggregatedData {
  byDay: Map<string, DailyAggregation>;
  byModel: Map<string, ModelAggregation>;
  byProvider: Map<string, ProviderAggregation>;
  bySessionType: Map<string, SessionTypeAggregation>;
  bySession: Map<string, {
    sessionId: string;
    agentType: string;
    sessionType: 'main' | 'cron' | 'subagent';
    label: string;
    totalTokens: number;
    totalCost: number;
    timestamp: string;
  }>;
}
