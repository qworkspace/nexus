"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { TokenAlert } from "@/lib/tokens/types";

interface TokenAlertsPanelProps {
  alerts: TokenAlert[];
}

const getSeverityColor = (severity: "warning" | "critical"): string => {
  switch (severity) {
    case "critical":
      return "text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
    default:
      return "text-muted-foreground dark:text-muted-foreground bg-zinc-50 dark:bg-background/30 border-zinc-200 dark:border-border";
  }
};

export function TokenAlertsPanel({ alerts }: TokenAlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dismissedTokenAlerts");
      if (stored) {
        setDismissedAlerts(new Set(JSON.parse(stored)));
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Save dismissed alerts to localStorage
  const handleDismiss = (alertKey: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertKey);
    setDismissedAlerts(newDismissed);
    try {
      localStorage.setItem("dismissedTokenAlerts", JSON.stringify(Array.from(newDismissed)));
    } catch {
      // Silently fail
    }
  };

  const activeAlerts = alerts.filter(
    (alert) => !dismissedAlerts.has(`${alert.type}-${alert.date}`)
  );

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className={getSeverityColor(activeAlerts[0].severity)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Token Usage Alerts
          </CardTitle>
          <button
            onClick={() => {
              activeAlerts.forEach((alert) => handleDismiss(`${alert.type}-${alert.date}`));
            }}
            className="text-xs hover:opacity-80 transition-opacity"
          >
            Dismiss All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activeAlerts.map((alert) => {
            const alertKey = `${alert.type}-${alert.date}`;
            return (
              <div
                key={alertKey}
                className="flex items-start justify-between gap-3 p-2 rounded bg-white/50 dark:bg-black/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-0.5">
                    {alert.severity === "critical" ? "Critical" : "Warning"} • {alert.date}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(alertKey)}
                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
