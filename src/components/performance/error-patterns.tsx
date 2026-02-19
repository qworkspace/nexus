"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ErrorPattern {
  message: string;
  count: number;
  lastOccurred: string;
}

export function ErrorPatterns({ errors }: { errors: ErrorPattern[] }) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle size={16} />
            Error Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-zinc-900">
            <CheckCircle size={24} className="mr-2" />
            <span className="text-sm font-medium">No errors in the last 30 days!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <AlertTriangle size={16} />
          Error Patterns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {errors.map((error, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-0"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-xs font-bold shrink-0">
                {error.count}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {error.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last: {formatTime(error.lastOccurred)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
