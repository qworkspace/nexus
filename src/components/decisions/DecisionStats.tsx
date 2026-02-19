"use client";

import { DecisionStats as Stats } from "@/types/decision";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, TrendingUp } from "lucide-react";

interface DecisionStatsProps {
  stats: Stats | null;
  loading?: boolean;
}

export function DecisionStats({ stats, loading }: DecisionStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-zinc-200 rounded w-20 mb-2" />
              <div className="h-8 bg-zinc-200 rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Decisions",
      value: stats.total.toString(),
      icon: TrendingUp,
      color: "text-zinc-900",
      bgColor: "bg-zinc-50",
    },
    {
      label: "Success Rate",
      value: `${stats.successRate.toFixed(1)}%`,
      subValue: `${stats.successCount} of ${stats.successCount + stats.failCount}`,
      icon: CheckCircle,
      color: "text-zinc-900",
      bgColor: "bg-zinc-50",
    },
    {
      label: "Avg Confidence",
      value: `${(stats.avgConfidence * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-zinc-500",
      bgColor: "bg-zinc-50",
    },
    {
      label: "Pending",
      value: stats.pendingCount.toString(),
      icon: Clock,
      color: "text-zinc-500",
      bgColor: "bg-zinc-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label} className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                <p className="text-2xl font-semibold text-zinc-900">{card.value}</p>
                {card.subValue && (
                  <p className="text-xs text-muted-foreground mt-1">{card.subValue}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
