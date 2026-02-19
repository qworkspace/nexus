"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCommandStore } from "@/stores/commandStore";
import { Rocket } from "lucide-react";

const TEMPLATES = [
  { name: "CryptoMon Feature", task: "Build the feature for CryptoMon..." },
  { name: "Nexus", task: "Improve Nexus interface..." },
  { name: "Bug Fix", task: "Fix the issue reported..." },
  { name: "Research", task: "Research and document..." },
];

const TIMEOUTS = [
  { label: "30 minutes", value: "30m" },
  { label: "1 hour", value: "1h" },
  { label: "2 hours", value: "2h" },
  { label: "4 hours", value: "4h" },
];

export function SpawnDialog() {
  const { spawnOpen, closeSpawn } = useCommandStore();
  const [agent, setAgent] = useState("dev");
  const [task, setTask] = useState("");
  const [label, setLabel] = useState("");
  const [timeout, setTimeout] = useState("2h");

  const handleSpawn = () => {
    // In a real implementation, this would spawn the agent
    console.log("Spawning agent:", { agent, task, label, timeout });
    closeSpawn();
  };

  const handleTemplateClick = (template: { name: string; task: string }) => {
    setLabel(template.name.toLowerCase().replace(/\s+/g, "-"));
    setTask(template.task);
  };

  return (
    <Dialog open={spawnOpen} onOpenChange={closeSpawn}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket size={16} /> SPAWN AGENT
            <span className="ml-auto text-xs text-muted-foreground font-normal">ESC</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="agent">Agent</Label>
            <select
              id="agent"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value="dev">Dev</option>
              <option value="research">Research</option>
              <option value="build">Build</option>
            </select>
          </div>

          <div>
            <Label htmlFor="task">Task</Label>
            <Textarea
              id="task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe the task..."
              rows={4}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., feature-name"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Templates</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateClick(template)}
                  type="button"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="timeout">Timeout</Label>
            <select
              id="timeout"
              value={timeout}
              onChange={(e) => setTimeout(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {TIMEOUTS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeSpawn}>
            Cancel
          </Button>
          <Button onClick={handleSpawn}>
            <Rocket size={14} /> Spawn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
