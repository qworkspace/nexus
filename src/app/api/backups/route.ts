import { NextResponse } from 'next/server';
import {
  checkAllBackups,
  getBackupAlerts,
  DEFAULT_REPOS,
  BackupStatus,
} from '@/lib/backup-checker';

export interface BackupsResponse {
  backups: BackupStatus[];
  alerts: {
    critical: BackupStatus[];
    warning: BackupStatus[];
    info: BackupStatus[];
  };
  summary: {
    totalRepos: number;
    healthy: number;
    warning: number;
    error: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
  timestamp: number;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

let cachedResponse: BackupsResponse | null = null;
let cacheTimestamp = 0;

export async function GET(): Promise<NextResponse<BackupsResponse>> {
  const now = Date.now();

  // Return cached response if still valid
  if (cachedResponse && now - cacheTimestamp < CACHE_DURATION) {
    return NextResponse.json(cachedResponse);
  }

  try {
    // Check all backup repos
    const backups = checkAllBackups(DEFAULT_REPOS);
    const alerts = getBackupAlerts(backups);

    // Calculate summary
    const summary = {
      totalRepos: backups.length,
      healthy: backups.filter((b) => b.status === 'success').length,
      warning: backups.filter((b) => b.status === 'warning').length,
      error: backups.filter((b) => b.status === 'error').length,
      totalSize: backups.reduce((sum, b) => sum + b.sizeBytes, 0),
      totalSizeFormatted: formatBytes(backups.reduce((sum, b) => sum + b.sizeBytes, 0)),
    };

    const response: BackupsResponse = {
      backups,
      alerts,
      summary,
      timestamp: now,
    };

    // Cache the response
    cachedResponse = response;
    cacheTimestamp = now;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch backup status:', error);
    return NextResponse.json(
      {
        backups: [],
        alerts: { critical: [], warning: [], info: [] },
        summary: {
          totalRepos: 0,
          healthy: 0,
          warning: 0,
          error: 0,
          totalSize: 0,
          totalSizeFormatted: '0 B',
        },
        timestamp: now,
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
