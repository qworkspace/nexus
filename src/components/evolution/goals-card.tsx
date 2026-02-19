"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Target, CheckSquare, Square } from "lucide-react";

interface Goal {
  text: string;
  done: boolean;
}

interface GoalsCardProps {
  goals: {
    quarter: string;
    categories: {
      name: string;
      goals: Goal[];
    }[];
  };
}

export function GoalsCard({ goals }: GoalsCardProps) {
  const calculateProgress = (goalItems: Goal[]) => {
    if (goalItems.length === 0) return 0;
    const done = goalItems.filter((g) => g.done).length;
    return Math.round((done / goalItems.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target size={18} />
          {goals.quarter} Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.categories.map((category, catIdx) => {
            const progress = calculateProgress(category.goals);

            return (
              <div key={catIdx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-900">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <div className="mb-3">
                  <div className="w-full bg-zinc-200 rounded-full h-1.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        progress >= 80
                          ? "bg-zinc-500"
                          : progress >= 50
                          ? "bg-yellow-500"
                          : "bg-zinc-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 ml-2">
                  {category.goals.map((goal, goalIdx) => (
                    <div
                      key={goalIdx}
                      className={cn(
                        "text-sm flex items-start gap-2",
                        goal.done ? "text-muted-foreground line-through" : "text-zinc-700"
                      )}
                    >
                      <span className="mt-0.5">
                        {goal.done ? <CheckSquare size={14} className="text-zinc-900" /> : <Square size={14} className="text-muted-foreground" />}
                      </span>
                      <span>{goal.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {goals.categories.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No goals set for this quarter
          </div>
        )}
      </CardContent>
    </Card>
  );
}
