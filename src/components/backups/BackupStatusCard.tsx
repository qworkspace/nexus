"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackupStatus } from "@/lib/backup-checker";
import { AlertTriangle, Check, CheckCircle, Clock, Database, GitCommit, Info, X, XCircle} from "lucide-react";

interface BackupStatusCardProps {
  backup: BackupStatus;
  onRefresh?: () => void;
}

export function BackupStatusCard({ backup, onRefresh }: BackupStatusCardProps) {
  const getStatusIcon = () => {
    switch (backup.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-zinc-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-zinc-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (backup.status) {
      case 'success':
        return <Badge className="bg-zinc-500 hover:bg-[#F5D547]"><Check size={16} className="inline mr-1" /> Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertTriangle size={16} className="inline mr-1" /> Warning</Badge>;
      case 'error':
        return <Badge className="bg-zinc-500 hover:bg-zinc-600"><X size={16} className="inline mr-1" /> Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={backup.status === 'error' ? 'border-zinc-200' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">{backup.repo.name}</h3>
              {backup.repo.description && (
                <p className="text-sm text-muted-foreground">{backup.repo.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onRefresh && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message */}
        {backup.error && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
            <p className="text-sm text-zinc-700">{backup.error}</p>
          </div>
        )}

        {/* Status when exists */}
        {backup.exists && backup.isGitRepo && (
          <>
            {/* Last Backup */}
            {backup.lastCommit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">Last Backup</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeAgo(backup.lastCommit.timestamp)}
                  </span>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {backup.lastCommit.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {backup.lastCommit.author} • {formatDate(backup.lastCommit.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GitCommit className="h-3 w-3" />
                      {backup.lastCommit.shortHash}
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {backup.sizeFormatted}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Total Commits</div>
                <div className="text-lg font-semibold text-zinc-900">
                  {backup.totalCommits.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Hours Since Backup</div>
                <div className={`text-lg font-semibold ${backup.isStale ? 'text-zinc-500' : 'text-zinc-900'}`}>
                  {backup.hoursSinceBackup.toFixed(1)}h
                </div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Repository Size</div>
                <div className="text-lg font-semibold text-zinc-900">{backup.sizeFormatted}</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">File Count</div>
                <div className="text-lg font-semibold text-zinc-900">
                  {backup.fileCount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Remote Status */}
            <div className="bg-zinc-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-700">Remote Status</span>
                <Badge variant={backup.remoteStatus.hasRemote ? 'secondary' : 'outline'}>
                  {backup.remoteStatus.hasRemote ? 'Connected' : 'No Remote'}
                </Badge>
              </div>
              {backup.remoteStatus.hasRemote ? (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {backup.remoteStatus.isAhead > 0 && (
                    <div className="text-yellow-600">
                      ↑ {backup.remoteStatus.isAhead} commit{backup.remoteStatus.isAhead > 1 ? 's' : ''} ahead
                    </div>
                  )}
                  {backup.remoteStatus.isBehind > 0 && (
                    <div className="text-zinc-500">
                      ↓ {backup.remoteStatus.isBehind} commit{backup.remoteStatus.isBehind > 1 ? 's' : ''} behind
                    </div>
                  )}
                  {backup.remoteStatus.isAhead === 0 && backup.remoteStatus.isBehind === 0 && (
                    <div className="text-zinc-900"><Check size={16} className="inline mr-1" /> Up to date with remote</div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No remote configured. Consider adding a remote backup location.
                </p>
              )}
            </div>
          </>
        )}

        {/* Path */}
        <div className="text-xs text-muted-foreground">
          {backup.repo.path}
        </div>
      </CardContent>
    </Card>
  );
}
