"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommandStore } from "@/stores/commandStore";
import { Check, Play } from 'lucide-react';


interface Cron {
  id: string;
  name: string;
  nextRun: string;
  status: string;
}

const RECENT_CRONS: Cron[] = [
  { id: "1", name: "Morning Brief", nextRun: "Tomorrow 7:07 AM", status: "active" },
  { id: "2", name: "Wellness Check (Evening)", nextRun: "Today 7:11 PM", status: "active" },
  { id: "3", name: "Cron Failure Monitor", nextRun: "In 12 minutes", status: "active" },
];

export function CronRunDialog() {
  const { cronOpen, closeCron } = useCommandStore();
  const [query, setQuery] = useState("");
  const [selectedCron, setSelectedCron] = useState<Cron | null>(null);
  const crons = useState<Cron[]>(RECENT_CRONS)[0];

  const filteredCrons = crons.filter((cron) =>
    cron.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleRun = () => {
    if (selectedCron) {
      // In a real implementation, this would trigger the cron
      console.log("Running cron:", selectedCron);
      closeCron();
    }
  };

  useEffect(() => {
    setSelectedCron(null);
    setQuery("");
  }, [cronOpen]);

  return (
    <Dialog open={cronOpen} onOpenChange={closeCron}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            RUN CRON JOB
            <span className="ml-auto text-xs text-muted-foreground font-normal">ESC</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Input
              placeholder="Search crons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">RECENT</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredCrons.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No crons found
                </div>
              ) : (
                filteredCrons.map((cron) => (
                  <button
                    key={cron.id}
                    onClick={() => setSelectedCron(cron)}
                    className={`w-full flex items-center justify-between p-3 text-left rounded-md transition-colors ${
                      selectedCron?.id === cron.id
                        ? "bg-zinc-100 ring-2 ring-zinc-500"
                        : "hover:bg-zinc-50"
                    }`}
                    type="button"
                  >
                    <div>
                      <div className="font-medium text-zinc-900">{cron.name}</div>
                      <div className="text-xs text-muted-foreground">Next: {cron.nextRun}</div>
                    </div>
                    {selectedCron?.id === cron.id && (
                      <Check size={16} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {query === "" && (
            <Button variant="ghost" className="w-full text-sm text-muted-foreground">
              Show 49 crons...
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeCron}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={!selectedCron}>
            <Play size={14} /> Run Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
