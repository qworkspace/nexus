"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommandStore } from "@/stores/commandStore";
import { AlertTriangle, RefreshCw } from 'lucide-react';


interface Model {
  id: string;
  name: string;
  quality: string;
  cost: string;
}

const MODELS: Model[] = [
  {
    id: "claude-opus-4-5",
    name: "claude-opus-4-5",
    quality: "Best quality",
    cost: "$$$",
  },
  {
    id: "claude-sonnet-4-5",
    name: "claude-sonnet-4-5",
    quality: "Balanced",
    cost: "$$",
  },
  {
    id: "zai/glm-4.7-flash",
    name: "zai/glm-4.7-flash",
    quality: "Fast & free",
    cost: "FREE",
  },
  {
    id: "zai/glm-4.7",
    name: "zai/glm-4.7",
    quality: "Coding agent",
    cost: "FREE",
  },
];

export function ModelSwitcher() {
  const { modelOpen, closeModel } = useCommandStore();
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-5");

  const handleSwitch = () => {
    // In a real implementation, this would switch the model
    console.log("Switching to model:", selectedModel);
    closeModel();
  };

  const currentModel = MODELS.find((m) => m.id === selectedModel);

  return (
    <Dialog open={modelOpen} onOpenChange={closeModel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw size={16} /> SWITCH MODEL
            <span className="ml-auto text-xs text-muted-foreground font-normal">ESC</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-zinc-50 rounded-md">
            <div className="text-sm text-muted-foreground">Current</div>
            <div className="font-semibold text-zinc-900">
              {currentModel?.name} ({currentModel?.quality})
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">SELECT MODEL</h3>
            <div className="space-y-2">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  type="button"
                  className={`w-full flex items-center justify-between p-4 rounded-md border transition-colors ${
                    selectedModel === model.id
                      ? "border-zinc-500 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                      {selectedModel === model.id && (
                        <div className="w-2 h-2 rounded-full bg-card" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-zinc-900">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.quality}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">{model.cost}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
            <AlertTriangle size={16} />
            <span>Model change affects main session only</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeModel}>
            Cancel
          </Button>
          <Button onClick={handleSwitch}>
            Switch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
