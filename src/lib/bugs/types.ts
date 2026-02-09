export type Project = 'cryptomon' | 'mission-control' | 'content-pipeline' | 'cohera' | 'q-system';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'new' | 'investigating' | 'in-progress' | 'fixed' | 'wont-fix' | 'cannot-reproduce';
export type BugSource = 'testing' | 'manual' | 'build' | 'console' | 'user';

export interface Bug {
  id: string;
  title: string;
  description: string;
  project: Project;
  severity: Severity;
  status: BugStatus;
  source: BugSource;
  
  // Tracking
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  fixedAt?: string;
  fixedBy?: string;
  
  // Evidence
  screenshots?: string[];
  logs?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  
  // Resolution
  resolution?: string;
  fixCommit?: string;
  
  // Relations
  specId?: string;
  relatedBugs?: string[];
}

export interface BugIndex {
  bugs: Bug[];
  lastId: number;
}

export interface CreateBugInput {
  title: string;
  description: string;
  project: Project;
  severity: Severity;
  source: BugSource;
  assignedTo?: string;
  screenshots?: string[];
  logs?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  specId?: string;
}

export interface UpdateBugInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: BugStatus;
  assignedTo?: string;
  resolution?: string;
  fixCommit?: string;
  fixedBy?: string;
}

export interface BugFilters {
  project?: Project;
  severity?: Severity;
  status?: BugStatus;
  assignedTo?: string;
  limit?: number;
  offset?: number;
}

export interface BugStats {
  total: number;
  open: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byProject: Record<Project, number>;
  byStatus: Record<BugStatus, number>;
  fixedThisWeek: number;
}

export interface TestFailure {
  featureName: string;
  project: Project;
  errorMessage: string;
  logs?: string;
  screenshots?: string[];
  testSteps?: string;
}
