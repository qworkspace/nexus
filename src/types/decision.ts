// Decision Audit Trail Types

export interface DecisionContext {
  load?: string;
  [key: string]: unknown;
}

export interface DecisionReasoning {
  observations: string[];
}

export interface DecisionChoice {
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

export interface DecisionOutcome {
  actual: string;
  matched: boolean;
  feedback: string;
  recorded_at: number;
}

export interface Decision {
  decision_id: string;
  timestamp: number;
  datetime: string;
  agent: string;
  context: DecisionContext;
  reasoning: DecisionReasoning;
  decision: DecisionChoice;
  outcome?: DecisionOutcome;
  tags: string[];
}

export interface DecisionStats {
  total: number;
  successCount: number;
  failCount: number;
  pendingCount: number;
  successRate: number;
  avgConfidence: number;
  commonActions: { action: string; count: number }[];
  agents: string[];
  actionTypes: string[];
}

export type OutcomeFilter = "all" | "success" | "failed" | "pending";
export type DateRangeFilter = "today" | "week" | "all";
