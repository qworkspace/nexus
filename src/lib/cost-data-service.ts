import { execSync } from 'child_process';

interface CliDailyEntry {
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
  missingCostEntries?: number;
}

export interface CliResponse {
  daily: CliDailyEntry[];
  totals: Omit<CliDailyEntry, 'date' | 'missingCostEntries'> & { date?: string; missingCostEntries?: number };
  updatedAt?: number;
  days?: number;
}

interface CachedData {
  data: CliResponse;
  timestamp: number;
}

// Module-level cache (5 minutes)
let cache: CachedData | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch cost data from OpenClaw Gateway CLI
 * Uses 5-minute in-memory cache to avoid excessive CLI calls
 */
export async function fetchCostData(): Promise<CliResponse> {
  const now = Date.now();

  // Check cache
  if (cache && (now - cache.timestamp) < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    // Call CLI
    const command = 'openclaw gateway usage-cost --days 30 --json';
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    const data: CliResponse = JSON.parse(output);

    // Update cache
    cache = {
      data,
      timestamp: now
    };

    return data;
  } catch (error) {
    console.error('Failed to fetch cost data:', error);

    // Return empty structure on error (graceful degradation)
    return {
      daily: [],
      totals: {
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
      }
    };
  }
}

/**
 * Invalidate the cache (call after config changes or manual refresh)
 */
export function invalidateCostCache(): void {
  cache = null;
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): { cached: boolean; age: number | null } {
  if (!cache) return { cached: false, age: null };
  return { cached: true, age: Date.now() - cache.timestamp };
}
