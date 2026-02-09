// Transform API responses to component prop formats

// API types (from route.ts files)
export interface ApiActiveBuild {
  id: string;
  label: string;
  task: string;
  startedAt: string;
  runtime: number;
  tokens: number;
  model: string;
  status: 'building' | 'processing' | 'error';
}

export interface ApiSpecItem {
  id: string;
  title: string;
  status: 'ready' | 'building' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  created: string;
}

export interface ApiBuildStats {
  today: {
    lines_shipped: number;
    builds_completed: number;
    success_rate: number;
    avg_duration: number;
    total_tokens: number;
  };
  week: {
    lines_shipped: number;
    builds_completed: number;
    success_rate: number;
    avg_duration: number;
  };
  models: {
    [key: string]: {
      builds: number;
      tokens: number;
      lines: number;
    };
  };
}

export interface ApiRecentBuild {
  id: string;
  label: string;
  completedAt: string;
  lines: number;
  duration: number;
  status: 'success' | 'error' | 'cancelled';
  model?: string;
}

// Component prop types (from build-mock.ts)
export interface BuildSession {
  id: string;
  label: string;
  task: string;
  specPath?: string;
  status: 'building' | 'complete' | 'error';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  estimatedDuration?: number;
  tokenUsage?: number;
  error?: string;
  result?: string;
}

export interface QueuedSpec {
  id: string;
  name: string;
  specPath: string;
  estimatedDuration: string;
  addedAt: Date;
}

export interface BuildStats {
  completedToday: number;
  currentlyBuilding: number;
  queueSize: number;
  avgDuration: number;
  successRate: number;
  totalTimeToday: number;
  mostProductiveHour: string;
  buildsInPeakHour: number;
}

// Transform active builds from API to component format
export function transformActiveBuilds(apiBuilds: ApiActiveBuild[]): BuildSession[] {
  return apiBuilds.map((build) => ({
    id: build.id,
    label: build.label,
    task: build.task,
    startedAt: new Date(build.startedAt),
    status: build.status === 'error' ? 'error' : 'building',
    duration: build.runtime,
    tokenUsage: build.tokens,
    // Estimate duration based on tokens (rough heuristic: ~30 tokens/sec)
    estimatedDuration: Math.ceil(build.tokens / 30),
  }));
}

// Transform queue from API to component format
export function transformQueue(apiSpecs: ApiSpecItem[]): QueuedSpec[] {
  // Only include specs that are ready to build
  const readySpecs = apiSpecs.filter((spec) => spec.status === 'ready');

  // Estimate duration based on effort
  const effortToDuration: Record<string, string> = {
    small: '30-45 min',
    medium: '1-1.5 hours',
    large: '2-3 hours',
  };

  return readySpecs.slice(0, 10).map((spec) => ({
    id: spec.id,
    name: spec.title,
    specPath: `${spec.id}.md`,
    estimatedDuration: effortToDuration[spec.effort] || '1-1.5 hours',
    addedAt: new Date(spec.created),
  }));
}

// Transform stats from API to component format
export function transformStats(
  apiStats: ApiBuildStats,
  activeBuildsCount: number,
  queueSize: number
): BuildStats {
  return {
    completedToday: apiStats.today.builds_completed,
    currentlyBuilding: activeBuildsCount,
    queueSize,
    avgDuration: apiStats.today.avg_duration,
    successRate: Math.round(apiStats.today.success_rate * 100),
    totalTimeToday: apiStats.today.avg_duration * apiStats.today.builds_completed,
    mostProductiveHour: 'Unknown',
    buildsInPeakHour: apiStats.today.builds_completed,
  };
}

// Transform recent builds from API to component format
export function transformRecentBuilds(apiBuilds: ApiRecentBuild[]): BuildSession[] {
  return apiBuilds.map((build) => ({
    id: build.id,
    label: build.label,
    task: build.status === 'success' ? 'Build completed successfully' : 'Build failed',
    status: build.status === 'success' ? 'complete' : 'error',
    startedAt: new Date(new Date(build.completedAt).getTime() - build.duration * 1000),
    completedAt: new Date(build.completedAt),
    duration: build.duration,
    tokenUsage: Math.floor(build.lines / 0.4), // Reverse the heuristic
    result: build.status === 'success'
      ? `Successfully shipped ${build.lines} lines of code`
      : 'Build encountered an error',
    error: build.status !== 'success' ? 'Build failed' : undefined,
  }));
}
