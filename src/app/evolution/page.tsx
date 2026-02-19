import { StatsBar } from "@/components/evolution/stats-bar";
import { PillarCard } from "@/components/evolution/pillar-card";
import { LessonsCard } from "@/components/evolution/lessons-card";
import { EvolutionLog } from "@/components/evolution/evolution-log";
import { GoalsCard } from "@/components/evolution/goals-card";
import { Bot } from "lucide-react";

async function getEvolutionData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/evolution`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch evolution data:", response.statusText);
      throw new Error("Failed to fetch evolution data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching evolution data:", error);
    // Return empty data structure on error
    return {
      pillars: [],
      lessons: { total: 0, recent: [] },
      evolutionLog: [],
      quarterlyGoals: { quarter: "", categories: [] },
      stats: { daysActive: 0, lessonsLearned: 0, totalCost: 0, successRate: 100 },
    };
  }
}

export default async function EvolutionPage() {
  const data = await getEvolutionData();

  const lastUpdated = new Date().toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <Bot size={24} />
          Q Evolution
        </h1>
        <p className="text-muted-foreground text-sm">
          Continuous improvement tracking — Is Q getting better?
        </p>
      </div>

      {/* Stats Bar */}
      <StatsBar stats={data.stats} />

      {/* Divider */}
      <div className="border-t border-zinc-200 my-8" />

      {/* Pillars */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {data.pillars.map((pillar: unknown, idx: number) => (
          <PillarCard key={idx} pillar={pillar as Parameters<typeof PillarCard>[0]["pillar"]} />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200 my-8" />

      {/* Lessons and Evolution Log */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <LessonsCard lessons={data.lessons} />
        <EvolutionLog entries={data.evolutionLog} />
      </div>

      {/* Quarterly Goals */}
      {data.quarterlyGoals.categories.length > 0 && (
        <>
          <div className="border-t border-zinc-200 my-8" />
          <div className="grid grid-cols-1">
            <GoalsCard goals={data.quarterlyGoals} />
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-muted-foreground">
        Last updated: {lastUpdated} • Built for PJ by Q
      </div>
    </div>
  );
}
