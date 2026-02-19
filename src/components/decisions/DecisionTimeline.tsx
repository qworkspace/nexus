"use client";

import { Decision } from "@/types/decision";
import { DecisionCard } from "./DecisionCard";
import { Skeleton } from "@/components/ui/skeleton";

interface DecisionTimelineProps {
  decisions: Decision[];
  loading?: boolean;
}

export function DecisionTimeline({ decisions, loading }: DecisionTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg mb-2">No decisions found</p>
        <p className="text-sm">
          Q&apos;s autonomous decisions will appear here once they are logged.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-zinc-200" />

      {/* Decision cards */}
      <div className="space-y-4">
        {decisions.map((decision) => (
          <div key={decision.decision_id} className="relative pl-12">
            {/* Timeline dot */}
            <div
              className={`absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                !decision.outcome
                  ? "bg-[#FFE135]"
                  : decision.outcome.matched
                  ? "bg-zinc-800"
                  : "bg-red-500"
              }`}
            />
            <DecisionCard decision={decision} />
          </div>
        ))}
      </div>
    </div>
  );
}
