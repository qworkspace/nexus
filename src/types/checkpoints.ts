// Checkpoint Types

export interface CheckpointFile {
  filename: string;
  agentType: string;
  sessionKey: string;
  timestamp: string;
  error: string;
  status: string;
  fullPath: string;
  dateDir: string;
  content?: string;
}

export interface CheckpointData {
  checkpoints: CheckpointFile[];
  dates: string[];
  totalCount: number;
  groupByDate: Record<string, CheckpointFile[]>;
}

export interface CheckpointDetailResponse {
  checkpoint: CheckpointFile;
}
