"use client";

import { useEffect, useState } from "react";
import { Bot, Monitor} from "lucide-react";

interface StatusBarData {
  model: string;
  activeAgents: number;
  nextCron: string;
  todayCost: string;
}

export function StatusBar() {
  const [data, setData] = useState<StatusBarData>({
    model: "Opus",
    activeAgents: 0,
    nextCron: "--",
    todayCost: "$0.00",
  });

  // In a real implementation, this would fetch from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get today's cost
        const costRes = await fetch('/api/costs/today');
        if (costRes.ok) {
          const costData = await costRes.json();
          setData((prev) => ({
            ...prev,
            todayCost: costData.total || "$0.00",
          }));
        }

        // Get active agents
        const agentsRes = await fetch('/api/agents');
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          const active = agentsData.filter((a: { status: string }) => a.status === 'running').length;
          setData((prev) => ({
            ...prev,
            activeAgents: active,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch status bar data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-card text-foreground text-xs flex items-center px-4 gap-6 z-50">
      <div className="flex items-center gap-1.5">
        <Bot size={16} />
        <span className="text-muted-foreground">Q:</span>
        <span className="text-foreground">{data.model}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Monitor size={12} />
        <span className="text-muted-foreground">Dev:</span>
        <span className="text-foreground">{data.activeAgents} building</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#D4C5A9] inline-block" />
        <span className="text-muted-foreground">Next cron:</span>
        <span className="text-foreground">{data.nextCron}</span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-zinc-400">{data.todayCost}</span>
      </div>

      <div className="text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">⌘K</kbd>
      </div>
    </div>
  );
}
