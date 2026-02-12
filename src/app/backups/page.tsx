"use client";

import { useEffect, useState } from 'react';
import { BackupStatusCard, BackupHistory, BackupAlerts, BackupStats } from '@/components/backups';
import { BackupStatus } from '@/lib/backup-checker';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BackupsResponse {
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

export default function BackupsPage() {
  const [data, setData] = useState<BackupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/backups');
      if (!response.ok) {
        throw new Error('Failed to fetch backup status');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching backups:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBackups, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchBackups();
  };

  const formatLastUpdate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Backup Monitor</h1>
          <p className="text-zinc-500 text-sm">Loading backup status...</p>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-zinc-100 rounded-lg" />
          <div className="h-64 bg-zinc-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Backup Monitor</h1>
          <p className="text-zinc-500 text-sm">An error occurred</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Backup Monitor</h1>
            <p className="text-zinc-500 text-sm">
              Monitor Git backup status across all repositories
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-zinc-500">
                Last updated: {formatLastUpdate(data.timestamp)}
              </span>
            )}
            <Button onClick={handleRefresh} disabled={loading} className="gap-2">
              {loading ? 'Refreshing...' : 'Refresh'}
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Alerts */}
          {(data.alerts.critical.length > 0 ||
            data.alerts.warning.length > 0 ||
            data.alerts.info.length > 0) && (
            <div className="mb-6">
              <BackupAlerts
                critical={data.alerts.critical}
                warning={data.alerts.warning}
                info={data.alerts.info}
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Backup Status Cards */}
            <div className="lg:col-span-2 space-y-6">
              {data.backups.map((backup) => (
                <BackupStatusCard
                  key={backup.repo.name}
                  backup={backup}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>

            {/* Right Column - Stats and History */}
            <div className="space-y-6">
              <BackupStats
                totalRepos={data.summary.totalRepos}
                healthy={data.summary.healthy}
                warning={data.summary.warning}
                error={data.summary.error}
                totalSize={data.summary.totalSizeFormatted}
              />

              {/* History for each repo */}
              {data.backups.map((backup) => {
                if (!backup.exists || !backup.isGitRepo) return null;

                return (
                  <BackupHistory
                    key={`${backup.repo.name}-history`}
                    commits={backup.recentCommits}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
