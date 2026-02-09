import { execSync } from 'child_process';

export interface BackupRepo {
  name: string;
  path: string;
  description?: string;
}

export interface CommitInfo {
  hash: string;
  shortHash: string;
  timestamp: number;
  author: string;
  message: string;
  isoDate: string;
}

export interface BackupStatus {
  repo: BackupRepo;
  exists: boolean;
  isGitRepo: boolean;
  lastCommit: CommitInfo | null;
  totalCommits: number;
  hoursSinceBackup: number;
  isStale: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  fileCount: number;
  remoteStatus: {
    hasRemote: boolean;
    isAhead: number;
    isBehind: number;
    lastPush?: CommitInfo | null;
  };
  recentCommits: CommitInfo[];
  status: 'success' | 'warning' | 'error' | 'unknown';
  error?: string;
}

export const STALE_THRESHOLD_HOURS = 24;
export const WARNING_THRESHOLD_HOURS = 20;
export const HISTORY_DAYS = 7;

export const DEFAULT_REPOS: BackupRepo[] = [
  {
    name: 'Q Workspace',
    path: process.env.OPENCLAW_WORKSPACE || '/Users/paulvillanueva/.openclaw/workspace',
    description: 'Primary workspace backup',
  },
  {
    name: 'Mission Control',
    path: '/Users/paulvillanueva/dev/projects/mission-control',
    description: 'Mission Control project',
  },
];

/**
 * Check if a directory exists
 */
export function checkDirectoryExists(path: string): boolean {
  try {
    execSync(`test -d "${path}" && echo "exists" || echo "not_found"`, {
      encoding: 'utf-8',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory is a git repository
 */
export function checkIsGitRepo(path: string): boolean {
  try {
    execSync(`cd "${path}" && git rev-parse --git-dir`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the last commit from a repository
 */
export function getLastCommit(path: string): CommitInfo | null {
  try {
    const output = execSync(
      `cd "${path}" && git log -1 --format="%H|%h|%ct|%an|%s"`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 5000,
      }
    ).trim();

    const [hash, shortHash, timestamp, author, message] = output.split('|');
    const ts = parseInt(timestamp, 10) * 1000; // Convert to milliseconds

    return {
      hash,
      shortHash,
      timestamp: ts,
      author,
      message,
      isoDate: new Date(ts).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Get the total number of commits
 */
export function getTotalCommits(path: string): number {
  try {
    const output = execSync(`cd "${path}" && git rev-list --count HEAD`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 5000,
    }).trim();
    return parseInt(output, 10);
  } catch {
    return 0;
  }
}

/**
 * Get recent commits from the last N days
 */
export function getRecentCommits(path: string, days: number = HISTORY_DAYS): CommitInfo[] {
  try {
    const output = execSync(
      `cd "${path}" && git log --since="${days} days ago" --format="%H|%h|%ct|%an|%s"`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 10000,
      }
    ).trim();

    if (!output) return [];

    return output.split('\n').map((line) => {
      const [hash, shortHash, timestamp, author, message] = line.split('|');
      const ts = parseInt(timestamp, 10) * 1000;
      return {
        hash,
        shortHash,
        timestamp: ts,
        author,
        message,
        isoDate: new Date(ts).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get remote status (ahead/behind, last push)
 */
export function getRemoteStatus(path: string): BackupStatus['remoteStatus'] {
  const defaultStatus: BackupStatus['remoteStatus'] = {
    hasRemote: false,
    isAhead: 0,
    isBehind: 0,
    lastPush: null,
  };

  try {
    // Check if remote exists
    const remotes = execSync(`cd "${path}" && git remote`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    if (!remotes) {
      return defaultStatus;
    }

    // Get remote tracking branch
    try {
      const tracking = execSync(
        `cd "${path}" && git rev-parse --abbrev-ref --symbolic-full-name @{u}`,
        {
          encoding: 'utf-8',
          stdio: 'pipe',
        }
      ).trim();

      const ahead = execSync(`cd "${path}" && git rev-list --count ${tracking}..HEAD`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      const behind = execSync(`cd "${path}" && git rev-list --count HEAD..${tracking}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();

      // Get last push time
      const lastPush = getLastCommit(path);

      return {
        hasRemote: true,
        isAhead: parseInt(ahead, 10),
        isBehind: parseInt(behind, 10),
        lastPush,
      };
    } catch {
      // Remote exists but no tracking branch
      return {
        hasRemote: true,
        isAhead: 0,
        isBehind: 0,
        lastPush: getLastCommit(path),
      };
    }
  } catch {
    return defaultStatus;
  }
}

/**
 * Get repository size in bytes and file count
 */
export function getRepoSize(path: string): { bytes: number; fileCount: number } {
  try {
    // On macOS, du doesn't support -b, so we use -k and convert
    const sizeOutput = execSync(`cd "${path}" && du -sk . | cut -f1`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 15000,
    }).trim();
    const bytes = parseInt(sizeOutput, 10) * 1024; // Convert KB to bytes

    const countOutput = execSync(`cd "${path}" && find . -type f | wc -l`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 15000,
    }).trim();
    const fileCount = parseInt(countOutput, 10);

    return { bytes, fileCount };
  } catch {
    return { bytes: 0, fileCount: 0 };
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Determine backup status based on last backup time
 */
export function determineStatus(hoursSince: number): 'success' | 'warning' | 'error' | 'unknown' {
  if (hoursSince === 0) return 'unknown';
  if (hoursSince > STALE_THRESHOLD_HOURS) return 'error';
  if (hoursSince > WARNING_THRESHOLD_HOURS) return 'warning';
  return 'success';
}

/**
 * Check backup status for a single repository
 */
export function checkBackupStatus(repo: BackupRepo): BackupStatus {
  try {
    const exists = checkDirectoryExists(repo.path);
    if (!exists) {
      return {
        repo,
        exists: false,
        isGitRepo: false,
        lastCommit: null,
        totalCommits: 0,
        hoursSinceBackup: 0,
        isStale: true,
        sizeBytes: 0,
        sizeFormatted: '0 B',
        fileCount: 0,
        remoteStatus: {
          hasRemote: false,
          isAhead: 0,
          isBehind: 0,
        },
        recentCommits: [],
        status: 'error',
        error: 'Directory not found',
      };
    }

    const isGitRepo = checkIsGitRepo(repo.path);
    if (!isGitRepo) {
      return {
        repo,
        exists: true,
        isGitRepo: false,
        lastCommit: null,
        totalCommits: 0,
        hoursSinceBackup: 0,
        isStale: true,
        sizeBytes: 0,
        sizeFormatted: '0 B',
        fileCount: 0,
        remoteStatus: {
          hasRemote: false,
          isAhead: 0,
          isBehind: 0,
        },
        recentCommits: [],
        status: 'error',
        error: 'Not a git repository',
      };
    }

    const lastCommit = getLastCommit(repo.path);
    if (!lastCommit) {
      return {
        repo,
        exists: true,
        isGitRepo: true,
        lastCommit: null,
        totalCommits: 0,
        hoursSinceBackup: 0,
        isStale: true,
        sizeBytes: 0,
        sizeFormatted: '0 B',
        fileCount: 0,
        remoteStatus: {
          hasRemote: false,
          isAhead: 0,
          isBehind: 0,
        },
        recentCommits: [],
        status: 'error',
        error: 'No commits found',
      };
    }

    const totalCommits = getTotalCommits(repo.path);
    const recentCommits = getRecentCommits(repo.path);
    const remoteStatus = getRemoteStatus(repo.path);
    const { bytes, fileCount } = getRepoSize(repo.path);

    const now = Date.now();
    const hoursSinceBackup = (now - lastCommit.timestamp) / (1000 * 60 * 60);
    const isStale = hoursSinceBackup > STALE_THRESHOLD_HOURS;
    const status = determineStatus(hoursSinceBackup);

    return {
      repo,
      exists: true,
      isGitRepo: true,
      lastCommit,
      totalCommits,
      hoursSinceBackup: parseFloat(hoursSinceBackup.toFixed(1)),
      isStale,
      sizeBytes: bytes,
      sizeFormatted: formatBytes(bytes),
      fileCount,
      remoteStatus,
      recentCommits,
      status,
    };
  } catch (error) {
    return {
      repo,
      exists: false,
      isGitRepo: false,
      lastCommit: null,
      totalCommits: 0,
      hoursSinceBackup: 0,
      isStale: true,
      sizeBytes: 0,
      sizeFormatted: '0 B',
      fileCount: 0,
      remoteStatus: {
        hasRemote: false,
        isAhead: 0,
        isBehind: 0,
      },
      recentCommits: [],
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check backup status for all configured repositories
 */
export function checkAllBackups(repos: BackupRepo[] = DEFAULT_REPOS): BackupStatus[] {
  return repos.map((repo) => checkBackupStatus(repo));
}

/**
 * Get backup alerts (stale backups, errors, etc.)
 */
export function getBackupAlerts(backups: BackupStatus[]): {
  critical: BackupStatus[];
  warning: BackupStatus[];
  info: BackupStatus[];
} {
  const critical: BackupStatus[] = [];
  const warning: BackupStatus[] = [];
  const info: BackupStatus[] = [];

  backups.forEach((backup) => {
    if (backup.status === 'error') {
      critical.push(backup);
    } else if (backup.status === 'warning') {
      warning.push(backup);
    } else if (!backup.remoteStatus.hasRemote && backup.exists) {
      info.push(backup);
    }
  });

  return { critical, warning, info };
}
