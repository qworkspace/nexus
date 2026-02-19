"use client";

import { useState } from "react";
import { Zap, Brain, Sparkles, Eye, type LucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommandStore } from "@/stores/commandStore";
import { cn } from "@/lib/utils";

const MODELS: Array<{
  id: string;
  name: string;
  icon: LucideIcon;
  desc: string;
  cost: string;
}> = [
  { 
    id: "claude-opus-4-5", 
    name: "Claude Opus 4.5", 
    icon: Brain, 
    desc: "Most capable, best for complex tasks",
    cost: "$15/M in, $75/M out",
  },
  { 
    id: "claude-sonnet-4", 
    name: "Claude Sonnet 4", 
    icon: Sparkles, 
    desc: "Balanced performance and cost",
    cost: "$3/M in, $15/M out",
  },
  { 
    id: "claude-3-5-haiku", 
    name: "Claude Haiku 3.5", 
    icon: Zap, 
    desc: "Fast, cheap, good for simple tasks",
    cost: "$0.25/M in, $1.25/M out",
  },
  { 
    id: "glm-4-flash", 
    name: "GLM 4 Flash", 
    icon: Eye, 
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
            <Zap size={16} />
            Switch Model
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {MODELS.map((model) => {
            const Icon = model.icon;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  selectedModel === model.id
                    ? "border-zinc-300 bg-zinc-50 dark:bg-zinc-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={24} className="text-zinc-600 dark:text-zinc-400" />
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
            );
          })}
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
