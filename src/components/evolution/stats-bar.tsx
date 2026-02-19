"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, BookOpen, DollarSign, CheckCircle } from "lucide-react";

interface StatsBarProps {
  stats: {
    daysActive: number;
    lessonsLearned: number;
    totalCost: number;
    successRate: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
            <Calendar size={14} />
            Days Active
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {stats.daysActive}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Since migration</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
            <BookOpen size={14} />
            Lessons Learned
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {stats.lessonsLearned}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mistakes prevented</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
            <DollarSign size={14} />
            Total Spent
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            ${stats.totalCost.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
            <CheckCircle size={14} />
            Success Rate
          </div>
          <div
            className={cn(
              "text-3xl font-bold",
              stats.successRate >= 95
                ? "text-green-600"
                : stats.successRate >= 80
                ? "text-yellow-600"
                : "text-red-600"
            )}
          >
            {stats.successRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
