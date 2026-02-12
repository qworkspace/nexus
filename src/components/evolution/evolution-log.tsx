"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface EvolutionLogEntry {
  date: string;
  change: string;
  impact: string;
}

interface EvolutionLogProps {
  entries: EvolutionLogEntry[];
}

export function EvolutionLog({ entries }: EvolutionLogProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp size={18} />
          Evolution Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <div key={idx} className="relative pl-4 border-l-2 border-zinc-200">
                <div className="mb-1">
                  <span className="text-xs font-medium text-zinc-500">
                    {formatDate(entry.date)}
                  </span>
                </div>
                <div className="text-sm font-medium text-zinc-900 mb-1">
                  {entry.change}
                </div>
                {entry.impact && (
                  <div className="text-xs text-zinc-500">{entry.impact}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-zinc-400 py-8">
            No evolution entries yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
