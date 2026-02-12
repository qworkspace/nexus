"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCommandStore } from "@/stores/commandStore";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, Zap, Eye, Bot, Rocket } from "lucide-react";

const MODELS = [
  { id: "claude-opus-4-5", name: "Opus 4.5", icon: Brain, desc: "Most capable" },
  { id: "claude-sonnet-4", name: "Sonnet 4", icon: Sparkles, desc: "Balanced" },
  { id: "claude-3-5-haiku", name: "Haiku 3.5", icon: Zap, desc: "Fast & cheap" },
  { id: "glm-4-flash", name: "GLM Flash", icon: Eye, desc: "Free local" },
];

export function SpawnAgentDialog() {
  const { spawnOpen, closeSpawn } = useCommandStore();
  const [label, setLabel] = useState("");
  const [model, setModel] = useState("claude-sonnet-4");
  const [spec, setSpec] = useState("");
  const [isSpawning, setIsSpawning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpawn = async () => {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    setIsSpawning(true);
    setError(null);

    try {
      const response = await fetch("/api/agents/spawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          model,
          spec: spec.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to spawn agent");
      }

      // Success - close and reset
      closeSpawn();
      setLabel("");
      setSpec("");
      setModel("claude-sonnet-4");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSpawning(false);
    }
  };

  const handleClose = () => {
    closeSpawn();
    setError(null);
  };

  return (
    <Dialog open={spawnOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot size={20} />
            Spawn New Agent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Agent Label</Label>
            <Input
              id="label"
              placeholder="e.g., dev-cryptomon, research-btc"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            <div className="grid grid-cols-2 gap-2">
              {MODELS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      model === m.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-zinc-600 dark:text-zinc-400" />
                      <span className="font-medium text-sm">{m.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Spec */}
          <div className="space-y-2">
            <Label htmlFor="spec">Initial Spec (optional)</Label>
            <Textarea
              id="spec"
              placeholder="What should this agent work on?"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSpawning}>
            Cancel
          </Button>
          <Button onClick={handleSpawn} disabled={isSpawning} className="flex items-center gap-2">
            {isSpawning ? "Spawning..." : (
              <>
                <Rocket size={16} />
                Spawn Agent
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
