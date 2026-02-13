"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2 } from "lucide-react";
import { ExtendedOutcome } from "@/types/decision";
import { generateOutcomeId } from "@/app/decisions/lib/decision-utils";

interface AddDecisionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDecisionModal({ onClose, onSuccess }: AddDecisionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([""]);
  const [spec, setSpec] = useState("");
  const [buildId, setBuildId] = useState("");
  const [outcomes, setOutcomes] = useState<ExtendedOutcome[]>([]);

  const addAlternative = () => {
    setAlternatives([...alternatives, ""]);
  };

  const updateAlternative = (index: number, value: string) => {
    const updated = [...alternatives];
    updated[index] = value;
    setAlternatives(updated);
  };

  const removeAlternative = (index: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== index));
  };

  const addOutcome = () => {
    setOutcomes([
      ...outcomes,
      {
        id: generateOutcomeId(),
        metric: "",
        value: 0,
        target: 100,
        unit: "",
        status: "pending",
        measuredAt: new Date().toISOString(),
      },
    ]);
  };

  const updateOutcome = (index: number, field: keyof ExtendedOutcome, value: string | number) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], [field]: value };
    setOutcomes(updated);
  };

  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const decision = {
      title,
      description,
      reasoning,
      alternatives: alternatives.filter(a => a.trim()),
      extendedContext: {
        description,
        alternatives: alternatives.filter(a => a.trim()),
        reasoning,
      },
      implementation: {
        spec: spec || undefined,
        buildId: buildId || undefined,
      },
      extendedOutcomes: outcomes,
    };

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decision),
      });

      if (res.ok) {
        onSuccess();
      } else {
        console.error("Failed to create decision");
      }
    } catch (error) {
      console.error("Error creating decision:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add New Decision</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                placeholder="e.g., Implement Zone System for Floor"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                rows={3}
                placeholder="Brief description of the decision"
                required
              />
            </div>

            {/* Reasoning */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Why this decision? (Reasoning)
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                rows={3}
                placeholder="Explain why this option was chosen over alternatives"
              />
            </div>

            {/* Alternatives */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Alternatives Considered
              </label>
              <div className="space-y-2">
                {alternatives.map((alt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={alt}
                      onChange={(e) => updateAlternative(i, e.target.value)}
                      className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      placeholder={`Alternative ${i + 1}`}
                    />
                    {alternatives.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAlternative(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAlternative}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Alternative
                </Button>
              </div>
            </div>

            {/* Implementation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Spec Document
                </label>
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  placeholder="spec-name.md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Build ID
                </label>
                <input
                  type="text"
                  value={buildId}
                  onChange={(e) => setBuildId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                  placeholder="#1234"
                />
              </div>
            </div>

            {/* Expected Outcomes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Expected Outcomes
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOutcome}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Outcome
                </Button>
              </div>

              {outcomes.length === 0 && (
                <p className="text-sm text-zinc-500 italic">
                  No outcomes defined yet. Click &ldquo;Add Outcome&rdquo; to add expected metrics.
                </p>
              )}

              <div className="space-y-3">
                {outcomes.map((outcome, i) => (
                  <div key={outcome.id} className="p-3 bg-zinc-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={outcome.metric}
                          onChange={(e) => updateOutcome(i, "metric", e.target.value)}
                          className="w-full px-2 py-1.5 border border-zinc-200 rounded text-sm"
                          placeholder="Metric name (e.g., Agent position changes)"
                        />
                      </div>
                      <input
                        type="number"
                        value={outcome.target}
                        onChange={(e) => updateOutcome(i, "target", parseFloat(e.target.value))}
                        className="px-2 py-1.5 border border-zinc-200 rounded text-sm"
                        placeholder="Target value"
                      />
                      <input
                        type="text"
                        value={outcome.unit}
                        onChange={(e) => updateOutcome(i, "unit", e.target.value)}
                        className="px-2 py-1.5 border border-zinc-200 rounded text-sm"
                        placeholder="Unit (%, ms, $)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOutcome(i)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Decision
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
