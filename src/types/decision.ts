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

// Extended outcome with metrics for validation
export interface ExtendedOutcome {
  id: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  status: 'pending' | 'passed' | 'failed';
  measuredAt: string;
}

// Implementation tracking
export interface DecisionImplementation {
  spec?: string;
  buildId?: string;
  deployedAt?: string;
}

// Expanded context
export interface ExtendedContext {
  description: string;
  alternatives: string[];
  reasoning: string;
}

// Status and impact
export type DecisionStatus = 'pending' | 'in-progress' | 'validated' | 'failed';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

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

  // New fields for enhanced tracking
  title?: string;
  description?: string;
  extendedContext?: ExtendedContext;
  implementation?: DecisionImplementation;
  extendedOutcomes?: ExtendedOutcome[];
  status?: DecisionStatus;
  impactLevel?: ImpactLevel;
  successScore?: number;
  validatedAt?: string;
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

  // New stats fields
  inProgressCount?: number;
  validatedCount?: number;
  failedCount?: number;
  avgSuccessScore?: number;
  highImpactCount?: number;
}

export type OutcomeFilter = "all" | "success" | "failed" | "pending";
export type DateRangeFilter = "today" | "week" | "all";
