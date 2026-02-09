// Activity types for transcript-based activity log

export interface ActivityInternal {
  id: string;
  timestamp: string;
  type: ActivityType;
  action: ActivityAction;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  duration: number | null;
  status: ActivityStatus;

  // Cost tracking
  tokensIn: number | null;
  tokensOut: number | null;
  tokensCacheRead: number | null;
  tokensCacheWrite: number | null;
  cost: number | null;
  model: string | null;

  // Session info
  sessionId: string | null;
}

export interface Activity {
  id: string;
  timestamp: string;
  type: ActivityType;
  action: ActivityAction;
  title: string;
  description: string | null;
  metadata: string | null; // Serialized as JSON string for UI compatibility
  duration: number | null;
  status: ActivityStatus;

  // Cost tracking
  tokensIn: number | null;
  tokensOut: number | null;
  tokensCacheRead: number | null;
  tokensCacheWrite: number | null;
  cost: number | null;
  model: string | null;

  // Session info
  sessionId: string | null;
}

export type ActivityType =
  | "task"
  | "message"
  | "cron"
  | "file"
  | "search"
  | "spawn"
  | "tool"
  | "model";

export type ActivityAction =
  | "completed"
  | "started"
  | "failed"
  | "sent"
  | "created"
  | "edited"
  | "deleted"
  | "called"
  | "received"
  | "changed";

export type ActivityStatus = "success" | "error" | "pending";

export interface ActivityFilters {
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface TranscriptEvent {
  type: string;
  id: string;
  parentId: string | null;
  timestamp: string;
  [key: string]: unknown;
}

export interface MessageEvent extends TranscriptEvent {
  type: "message";
  message: {
    role: string;
    content: Array<{ type: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  api?: string;
  provider?: string;
  model?: string;
  usage?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    totalTokens: number;
  };
  cost?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}

export interface ModelChangeEvent extends TranscriptEvent {
  type: "model_change";
  provider: string;
  modelId: string;
}

export interface CronEvent extends TranscriptEvent {
  type: "custom";
  customType: string;
}
