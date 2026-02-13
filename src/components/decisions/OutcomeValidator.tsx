"use client";

import { useState } from "react";
import { Decision, ExtendedOutcome } from "@/types/decision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save, X } from "lucide-react";
import { generateOutcomeId, calculateSuccessScore, determineStatus } from "@/app/decisions/lib/decision-utils";

interface OutcomeValidatorProps {
  decision: Decision;
}

export function OutcomeValidator({ decision }: OutcomeValidatorProps) {
  const [showForm, setShowForm] = useState(false);
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState(0);
  const [target, setTarget] = useState(100);
  const [unit, setUnit] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newOutcome: ExtendedOutcome = {
      id: generateOutcomeId(),
      metric,
      value,
      target,
      unit,
      status: value >= target ? 'passed' : 'failed',
      measuredAt: new Date().toISOString(),
    };

    const updatedOutcomes = [...(decision.extendedOutcomes || []), newOutcome];
    const newSuccessScore = calculateSuccessScore(updatedOutcomes);
    const newStatus = determineStatus(updatedOutcomes, decision.implementation?.deployedAt);

    try {
      const res = await fetch(`/api/decisions/${decision.decision_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extendedOutcomes: updatedOutcomes,
          successScore: newSuccessScore,
          status: newStatus,
          validatedAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setMetric("");
        setValue(0);
        setTarget(100);
        setUnit("");
        // Trigger page refresh
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to add outcome:", error);
    }
  };

  return (
    <>
      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Outcome
        </Button>
      ) : (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Validate Outcome</span>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  placeholder="e.g., Response time"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Actual Value
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  placeholder="e.g., ms, %, $"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  Save Outcome
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
