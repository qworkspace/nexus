"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Clock, CheckCircle, AlertTriangle, XCircle, Database } from "lucide-react";
import useSWR from "swr";

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

async function fetcher(url: string): Promise<BackupStatusResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function BackupMonitor() {
  const { data, error, isLoading } = useSWR<BackupStatusResponse>(
    "/api/backups/status",
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: false,
    }
  );

  const backup = data?.backup;
  const isStale = backup?.isStale || false;
  const status = backup?.status || 'error';

  const getStatusColor = () => {
    if (error || isLoading || !backup) return 'text-zinc-400';
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-zinc-400';
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getAlertMessage = () => {
    if (error) return `Error: ${error.message}`;
    if (isLoading) return 'Checking backup status...';
    if (!backup) return 'No backup data available';
    if (isStale) return `Backup overdue: ${backup.hoursSinceBackup.toFixed(1)}h ago`;
    if (status === 'warning') return `Backup aging: ${backup.hoursSinceBackup.toFixed(1)}h ago`;
    return null;
  };

  const alertMessage = getAlertMessage();

  return (
    <div className="col-span-12 lg:col-span-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Database className={`h-5 w-5 ${getStatusColor()}`} />
            BACKUP MONITOR
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Alerts */}
          {alertMessage && (
            <div className="mb-4">
              <AlertMessage
                type={isStale ? 'critical' : status === 'warning' ? 'warning' : error ? 'error' : 'info'}
                message={alertMessage}
              />
            </div>
          )}

          {/* All healthy message */}
          {!alertMessage && backup && !isStale && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Backup current: {formatTimeAgo(backup.lastBackupTime)}
                </span>
              </div>
            </div>
          )}

          {/* Backup Details */}
          {backup && (
            <div className="space-y-3">
              {/* Last Backup Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="h-4 w-4" />
                  <span>Last Backup</span>
                </div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDateTime(backup.lastBackupTime)}
                </div>
              </div>

              {/* Backup Size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <HardDrive className="h-4 w-4" />
                  <span>Size</span>
                </div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {backup.sizeFormatted}
                </div>
              </div>

              {/* File Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Database className="h-4 w-4" />
                  <span>Files</span>
                </div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {backup.fileCount.toLocaleString()}
                </div>
              </div>

              {/* Storage Location */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Database className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {backup.storageLocation.split('/').pop()}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 max-w-[200px] truncate">
                    {backup.storageLocation}
                  </div>
                </div>
              </div>

              {/* Source indicator */}
              {data?.source && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                    <span>Source</span>
                    <span className={`font-medium ${
                      data.source === 'live' ? 'text-green-600 dark:text-green-400' :
                      data.source === 'mock' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {data.source === 'live' ? 'Live' :
                       data.source === 'mock' ? 'Demo' :
                       'Error'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last commit message */}
          {backup && backup.lastBackupMessage && (
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Last Commit</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {backup.lastBackupMessage}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-mono">
                {backup.lastBackupCommit.substring(0, 7)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AlertMessageProps {
  type: 'critical' | 'warning' | 'error' | 'info';
  message: string;
}

function AlertMessage({ type, message }: AlertMessageProps) {
  const getStyles = () => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: 'text-yellow-500',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-500',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-500',
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    switch (type) {
      case 'critical':
        return <XCircle className={`h-4 w-4 ${styles.icon}`} />;
      case 'warning':
        return <AlertTriangle className={`h-4 w-4 ${styles.icon}`} />;
      case 'error':
        return <XCircle className={`h-4 w-4 ${styles.icon}`} />;
      default:
        return <Clock className={`h-4 w-4 ${styles.icon}`} />;
    }
  };

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${styles.bg} ${styles.border}`}>
      {getIcon()}
      <span className={`text-sm font-medium ${styles.text}`}>
        {message}
      </span>
    </div>
  );
}
