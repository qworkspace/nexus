"use client";

import { useState, useEffect, useCallback } from "react";
import { Decision, DecisionStats as Stats, DateRangeFilter, OutcomeFilter } from "@/types/decision";
import { DecisionStats } from "@/components/decisions/DecisionStats";
import { DecisionFilters } from "@/components/decisions/DecisionFilters";
import { DecisionTimeline } from "@/components/decisions/DecisionTimeline";
import { AddDecisionModal } from "@/components/decisions/AddDecisionModal";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [agent, setAgent] = useState("all");
  const [action, setAction] = useState("all");
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");

  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("dateRange", dateRange);
      params.set("agent", agent);
      params.set("action", action);
      params.set("outcome", outcome);

      const res = await fetch(`/api/decisions?${params}`);
      const data = await res.json();

      setDecisions(data.decisions || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to fetch decisions:", error);
      setDecisions([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, agent, action, outcome]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Decision Audit Trail</h1>
          <p className="text-zinc-500 text-sm">
            Q&apos;s autonomous decisions with reasoning chains and outcomes
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add Decision
        </button>
      </div>

      {/* Stats Cards */}
      <DecisionStats stats={stats} loading={loading} />

      {/* Filters */}
      <DecisionFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        agent={agent}
        setAgent={setAgent}
        action={action}
        setAction={setAction}
        outcome={outcome}
        setOutcome={setOutcome}
        agents={stats?.agents || []}
        actionTypes={stats?.actionTypes || []}
      />

      {/* Timeline */}
      <DecisionTimeline decisions={decisions} loading={loading} />

      {/* Common Actions footer */}
      {stats && stats.commonActions.length > 0 && !loading && (
        <div className="mt-8 p-4 bg-zinc-50 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-700 mb-3">Most Common Actions</h3>
          <div className="flex flex-wrap gap-2">
            {stats.commonActions.map(({ action, count }) => (
              <button
                key={action}
                onClick={() => setAction(action)}
                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-sm text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
              >
                {action} <span className="text-zinc-400">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Decision Modal */}
      {showAddModal && (
        <AddDecisionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDecisions();
          }}
        />
      )}
    </div>
  );
}
