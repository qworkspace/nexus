"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

interface PillarItem {
  name: string;
  status: "done" | "in-progress" | "not-started";
  owner?: string;
  notes?: string;
}

interface Pillar {
  name: string;
  emoji: string;
  status: "learning" | "ready" | "active" | "vibing" | "building";
  items: PillarItem[];
  description?: string;
}

interface PillarCardProps {
  pillar: Pillar;
}

const statusColors: Record<Pillar["status"], string> = {
  learning: "bg-zinc-100 text-zinc-800",
  ready: "bg-zinc-100 text-zinc-800",
  active: "bg-zinc-100 text-zinc-800",
  vibing: "bg-zinc-100 text-zinc-800",
  building: "bg-zinc-100 text-zinc-800",
};

const itemStatusColors: Record<PillarItem["status"], string> = {
  done: "text-zinc-900",
  "in-progress": "text-zinc-400",
  "not-started": "text-zinc-500",
};

const itemStatusIcons: Record<PillarItem["status"], JSX.Element> = {
  done: <CheckCircle size={14} className="text-zinc-900" />,
  "in-progress": <Circle size={14} className="fill-zinc-400 text-zinc-400" />,
  "not-started": <Circle size={14} className="fill-zinc-500 text-zinc-500" />,
};

export function PillarCard({ pillar }: PillarCardProps) {
  const [expanded] = useState(true);

  // Calculate completion percentage
  const total = pillar.items.length;
  const done = pillar.items.filter((i) => i.status === "done").length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{pillar.emoji}</span>
            <CardTitle className="text-lg font-semibold">
              {pillar.name}
            </CardTitle>
          </div>
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              statusColors[pillar.status]
            )}
          >
            {pillar.status.charAt(0).toUpperCase() + pillar.status.slice(1)}
          </span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  percentage >= 80
                    ? "bg-zinc-500"
                    : percentage >= 50
                    ? "bg-zinc-400"
                    : "bg-zinc-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Description (if available) */}
          {pillar.description && (
            <div className="mb-4 p-3 bg-zinc-50 rounded-lg">
              <p className="text-sm text-zinc-700 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          )}

          {/* Items */}
          {pillar.items.length > 0 && (
            <div className="space-y-2">
              {pillar.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  <span className={cn(itemStatusColors[item.status], "mt-0.5")}>
                    {itemStatusIcons[item.status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900">
                      {item.name}
                    </div>
                    {item.owner && (
                      <div className="text-xs text-muted-foreground">
                        Owner: {item.owner}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pillar.items.length === 0 && !pillar.description && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No items yet
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
