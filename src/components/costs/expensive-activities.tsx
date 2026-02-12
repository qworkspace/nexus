"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface ExpensiveActivity {
  id: string;
  title: string;
  type: string;
  cost: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  model: string | null;
  timestamp: Date;
}

export function ExpensiveActivities({
  activities,
}: {
  activities: ExpensiveActivity[];
}) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
            <DollarSign size={16} />
            Top Expensive Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 py-4 text-center">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
          <DollarSign size={16} />
          Top Expensive Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.map((activity, i) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-0"
            >
              <span className="text-xs text-zinc-400 w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {activity.type} · {activity.model || "unknown"} ·{" "}
                  {formatTokens(activity.tokensIn)} in / {formatTokens(activity.tokensOut)} out
                </p>
              </div>
              <span className="text-sm font-semibold text-zinc-900">
                ${(activity.cost || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTokens(tokens: number | null): string {
  if (!tokens) return "0";
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}
