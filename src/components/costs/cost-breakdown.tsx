"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BreakdownItem {
  label: string;
  cost: number;
  count: number;
}

export function CostBreakdown({
  title,
  items,
  icon,
}: {
  title: string;
  items: BreakdownItem[];
  icon: string;
}) {
  const total = items.reduce((sum, item) => sum + item.cost, 0);

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
            <span>{icon}</span>
            {title}
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
          <span>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => {
            const percentage = total > 0 ? (item.cost / total) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-700 font-medium truncate">
                    {item.label}
                  </span>
                  <span className="text-zinc-500 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">
                      {item.count} calls
                    </span>
                    ${item.cost.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
