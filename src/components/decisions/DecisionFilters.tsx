"use client";

import { Button } from "@/components/ui/button";
import { DateRangeFilter, OutcomeFilter } from "@/types/decision";

interface DecisionFiltersProps {
  dateRange: DateRangeFilter;
  setDateRange: (range: DateRangeFilter) => void;
  agent: string;
  setAgent: (agent: string) => void;
  action: string;
  setAction: (action: string) => void;
  outcome: OutcomeFilter;
  setOutcome: (outcome: OutcomeFilter) => void;
  agents: string[];
  actionTypes: string[];
}

export function DecisionFilters({
  dateRange,
  setDateRange,
  agent,
  setAgent,
  action,
  setAction,
  outcome,
  setOutcome,
  agents,
  actionTypes,
}: DecisionFiltersProps) {
  const hasFilters = dateRange !== "all" || agent !== "all" || action !== "all" || outcome !== "all";

  const clearFilters = () => {
    setDateRange("all");
    setAgent("all");
    setAction("all");
    setOutcome("all");
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6 p-4 bg-zinc-50 rounded-lg">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Period:</span>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
          className="px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm"
        >
          <option value="today">Today</option>
          <option value="week">Past Week</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Agent filter */}
      {agents.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Agent:</span>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action type filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Action:</span>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm"
        >
          <option value="all">All Actions</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Outcome filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Outcome:</span>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as OutcomeFilter)}
          className="px-3 py-2 rounded-md border border-zinc-200 bg-white text-sm"
        >
          <option value="all">All Outcomes</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="ml-auto"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
