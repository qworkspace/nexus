"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommandStore } from "@/stores/commandStore";
import { cn } from "@/lib/utils";

const MODELS = [
  { 
    id: "claude-opus-4-5", 
    name: "Claude Opus 4.5", 
    emoji: "🧠", 
    desc: "Most capable, best for complex tasks",
    cost: "$15/M in, $75/M out",
  },
  { 
    id: "claude-sonnet-4", 
    name: "Claude Sonnet 4", 
    emoji: "✨", 
    desc: "Balanced performance and cost",
    cost: "$3/M in, $15/M out",
  },
  { 
    id: "claude-3-5-haiku", 
    name: "Claude Haiku 3.5", 
    emoji: "⚡", 
    desc: "Fast, cheap, good for simple tasks",
    cost: "$0.25/M in, $1.25/M out",
  },
  { 
    id: "glm-4-flash", 
    name: "GLM 4 Flash", 
    emoji: "🔮", 
    desc: "Free local model (LM Studio)",
    cost: "Free",
  },
];

export function ModelSwitchDialog() {
  const { modelOpen, closeModel } = useCommandStore();
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-5");
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      // Would call openclaw model switch <model>
      await new Promise(resolve => setTimeout(resolve, 500));
      closeModel();
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Dialog open={modelOpen} onOpenChange={closeModel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Switch Model
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all",
                selectedModel === model.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{model.emoji}</span>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <p className="text-sm text-zinc-500">{model.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {model.cost}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={closeModel} disabled={isSwitching}>
            Cancel
          </Button>
          <Button onClick={handleSwitch} disabled={isSwitching}>
            {isSwitching ? "Switching..." : "Apply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
