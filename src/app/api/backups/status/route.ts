import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface BackupStatus {
  lastBackupTime: number;
  lastBackupTimeIso: string;
  lastBackupCommit: string;
  lastBackupMessage: string;
  lastBackupAuthor: string;
  hoursSinceBackup: number;
  isStale: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  fileCount: number;
  storageLocation: string;
  status: 'success' | 'warning' | 'error';
}

interface BackupStatusResponse {
  source: 'live' | 'mock' | 'error';
  backup: BackupStatus;
  error?: string;
}

const BACKUP_PATH = process.env.OPENCLAW_WORKSPACE || '/Users/paulvillanueva/.openclaw/workspace';
const STALE_THRESHOLD_HOURS = 25;

export async function GET(): Promise<NextResponse<BackupStatusResponse>> {
  try {
    // Check if workspace exists
    const workspaceCheck = execSync(`test -d "${BACKUP_PATH}" && echo "exists" || echo "not_found"`, {
      encoding: 'utf-8',
    }).trim();

    if (workspaceCheck !== 'exists') {
      return NextResponse.json({
        source: 'error',
        backup: getMockBackupStatus(),
        error: `Workspace not found at ${BACKUP_PATH}`,
      });
    }

    // Get last commit info
    let lastCommitHash = '';
    let lastCommitTime = 0;
    let lastCommitMessage = '';
    let lastCommitAuthor = '';

    try {
      const lastCommit = execSync(`cd "${BACKUP_PATH}" && git log -1 --format="%H|%ct|%an|%s"`, {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();

      const [hash, timestamp, author, message] = lastCommit.split('|');
      lastCommitHash = hash;
      lastCommitTime = parseInt(timestamp, 10) * 1000; // Convert to milliseconds
      lastCommitAuthor = author;
      lastCommitMessage = message;
    } catch (gitError) {
      console.error('Git error:', gitError);
      return NextResponse.json({
        source: 'mock',
        backup: getMockBackupStatus(),
        error: 'Git repository not accessible',
      });
    }

    // Get backup size and file count
    let sizeBytes = 0;
    let fileCount = 0;

    try {
      // On macOS, du doesn't support -b, so we use -k and convert
      const sizeOutput = execSync(`cd "${BACKUP_PATH}" && du -sk . | cut -f1`, {
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();
      sizeBytes = parseInt(sizeOutput, 10) * 1024; // Convert KB to bytes

      const countOutput = execSync(`cd "${BACKUP_PATH}" && find . -type f | wc -l`, {
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();
      fileCount = parseInt(countOutput, 10);
    } catch (fsError) {
      console.error('File system error:', fsError);
      sizeBytes = 0;
      fileCount = 0;
    }

    // Calculate time since last backup
    const now = Date.now();
    const hoursSinceBackup = (now - lastCommitTime) / (1000 * 60 * 60);
    const isStale = hoursSinceBackup > STALE_THRESHOLD_HOURS;

    // Determine status
    let status: 'success' | 'warning' | 'error' = 'success';
    if (isStale) {
      status = 'error';
    } else if (hoursSinceBackup > 20) {
      status = 'warning';
    }

    // Format size
    const sizeFormatted = formatBytes(sizeBytes);

    const backup: BackupStatus = {
      lastBackupTime: lastCommitTime,
      lastBackupTimeIso: new Date(lastCommitTime).toISOString(),
      lastBackupCommit: lastCommitHash,
      lastBackupMessage: lastCommitMessage,
      lastBackupAuthor: lastCommitAuthor,
      hoursSinceBackup: parseFloat(hoursSinceBackup.toFixed(1)),
      isStale,
      sizeBytes,
      sizeFormatted,
      fileCount,
      storageLocation: BACKUP_PATH,
      status,
    };

    return NextResponse.json({
      source: 'live',
      backup,
    });
  } catch (error) {
    console.error('Failed to fetch backup status:', error);
    return NextResponse.json({
      source: 'error',
      backup: getMockBackupStatus(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getMockBackupStatus(): BackupStatus {
  const now = Date.now();
  const hoursAgo = 2.5;
  const lastBackupTime = now - (hoursAgo * 60 * 60 * 1000);

  return {
    lastBackupTime,
    lastBackupTimeIso: new Date(lastBackupTime).toISOString(),
    lastBackupCommit: '9fe6349782b632489346798f02bcfc4164eb3de8',
    lastBackupMessage: 'Q System v2.0: All upgrades shipped + cron jobs configured',
    lastBackupAuthor: 'Q (Quorion)',
    hoursSinceBackup: hoursAgo,
    isStale: false,
    sizeBytes: 352321536,
    sizeFormatted: '336.0 MB',
    fileCount: 6514,
    storageLocation: BACKUP_PATH,
    status: 'success',
  };
}
