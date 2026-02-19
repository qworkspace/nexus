"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackupStatus } from "@/lib/backup-checker";
import { AlertTriangle, XCircle, Info, AlertCircle } from "lucide-react";

interface BackupAlertsProps {
  critical: BackupStatus[];
  warning: BackupStatus[];
  info: BackupStatus[];
}

export function BackupAlerts({ critical, warning, info }: BackupAlertsProps) {
  const totalAlerts = critical.length + warning.length + info.length;

  if (totalAlerts === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>Backup Alerts</span>
          </div>
          <Badge variant="destructive" className="text-xs">
            {totalAlerts}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Alerts */}
        {critical.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700">
              <XCircle className="h-4 w-4" />
              <span>Critical ({critical.length})</span>
            </div>
            <div className="space-y-2">
              {critical.map((backup) => (
                <div key={backup.repo.name} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-red-900">{backup.repo.name}</h4>
                    <Badge className="bg-red-500 hover:bg-red-600 text-xs">Error</Badge>
                  </div>
                  {backup.error && (
                    <p className="text-sm text-red-700">{backup.error}</p>
                  )}
                  {backup.hoursSinceBackup > 24 && backup.lastCommit && (
                    <p className="text-sm text-red-700 mt-1">
                      Last backup was {backup.hoursSinceBackup.toFixed(1)} hours ago
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Alerts */}
        {warning.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span>Warnings ({warning.length})</span>
            </div>
            <div className="space-y-2">
              {warning.map((backup) => (
                <div key={backup.repo.name} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-yellow-900">{backup.repo.name}</h4>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">Warning</Badge>
                  </div>
                  {backup.hoursSinceBackup > 20 && (
                    <p className="text-sm text-yellow-700">
                      Backup is {backup.hoursSinceBackup.toFixed(1)} hours old (approaching 24h threshold)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Alerts */}
        {info.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Info className="h-4 w-4" />
              <span>Info ({info.length})</span>
            </div>
            <div className="space-y-2">
              {info.map((backup) => (
                <div key={backup.repo.name} className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-zinc-900">{backup.repo.name}</h4>
                    <Badge variant="outline" className="text-xs">Info</Badge>
                  </div>
                  {!backup.remoteStatus.hasRemote && (
                    <p className="text-sm text-muted-foreground">
                      No remote repository configured. Consider adding a remote backup location.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
