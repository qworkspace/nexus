import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface PillarItem {
  name: string;
  status: "done" | "in-progress" | "not-started";
  owner?: string;
  notes?: string;
}

interface Pillar {
  name: string;
  emoji: string;
  status: "learning" | "ready" | "active" | "vibing" | "building";
  items: PillarItem[];
  description?: string;
}

interface Lesson {
  title: string;
  category: string;
  date: string;
}

interface EvolutionLogEntry {
  date: string;
  change: string;
  impact: string;
}

interface Goal {
  text: string;
  done: boolean;
}

interface QuarterlyGoals {
  quarter: string;
  categories: {
    name: string;
    goals: Goal[];
  }[];
}

interface EvolutionData {
  pillars: Pillar[];
  lessons: {
    total: number;
    recent: Lesson[];
  };
  evolutionLog: EvolutionLogEntry[];
  quarterlyGoals: QuarterlyGoals;
  stats: {
    daysActive: number;
    lessonsLearned: number;
    totalCost: number;
    successRate: number;
    agentsConfigured: number;
  };
}

// Parse EVOLUTION.md
function parseEvolutionMarkdown(content: string): {
  pillars: Pillar[];
  evolutionLog: EvolutionLogEntry[];
  quarterlyGoals: QuarterlyGoals;
} {
  const lines = content.split("\n");
  const pillars: Pillar[] = [];
  const evolutionLog: EvolutionLogEntry[] = [];
  const quarterlyGoals: QuarterlyGoals = {
    quarter: "",
    categories: [],
  };

  let currentPillar: Pillar | null = null;
  let currentSection: "pillars" | "evolution-log" | "goals" | null = null;
  let inTable = false;
  let capturingDescription = false;
  let descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect pillar sections
    const pillarMatch = line.match(/^### (🧠|🤖|🛠️|✨) \d+\.\s+(.+)$/);
    if (pillarMatch) {
      if (currentPillar) pillars.push(currentPillar);
      const emoji = pillarMatch[1];
      const name = pillarMatch[2];

      let status: Pillar["status"] = "learning";
      if (emoji === "🤖") status = "active";
      else if (emoji === "🛠️") status = "building";
      else if (emoji === "✨") status = "vibing";

      currentPillar = { name, emoji, status, items: [] };
      currentSection = "pillars";
      capturingDescription = true;
      descriptionLines = [];
      continue;
    }

    // Capture description lines for pillars (before table or next section)
    if (capturingDescription && currentPillar && currentSection === "pillars") {
      if (line.trim().startsWith("**Goal:**")) {
        descriptionLines.push(line.replace(/\*\*/g, "").trim());
      } else if (line.trim().startsWith("**")) {
        // End of description when we hit another bold heading or table
        if (line.includes("|") || line.startsWith("**") && !line.includes("Goal")) {
          capturingDescription = false;
          currentPillar.description = descriptionLines.join(" ");
        }
      }
    }

    // Detect Evolution Log section
    if (line.includes("## Evolution Log")) {
      if (currentPillar) pillars.push(currentPillar);
      currentSection = "evolution-log";
      currentPillar = null;
      inTable = false;
      continue;
    }

    // Detect Quarterly Goals section
    if (line.includes("## Quarterly Goals")) {
      if (currentPillar) pillars.push(currentPillar);
      currentSection = "goals";
      currentPillar = null;
      inTable = false;
      continue;
    }

    // Detect specific quarter
    const quarterMatch = line.match(/^### (Q\d+ \d{4})/);
    if (quarterMatch && currentSection === "goals") {
      quarterlyGoals.quarter = quarterMatch[1];
      continue;
    }

    // Detect goal categories
    const categoryMatch = line.match(/^\*\*(.+):\*\*/);
    if (categoryMatch && currentSection === "goals") {
      const categoryName = categoryMatch[1];
      const goals: Goal[] = [];

      // Parse goals for this category (look at next lines)
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("**") && !lines[j].startsWith("#")) {
        const goalLine = lines[j].trim();
        if (goalLine.startsWith("- [ ]")) {
          goals.push({ text: goalLine.substring(4).trim(), done: false });
        } else if (goalLine.startsWith("- [x]") || goalLine.startsWith("- [X]")) {
          goals.push({ text: goalLine.substring(4).trim(), done: true });
        }
        j++;
      }

      if (goals.length > 0) {
        quarterlyGoals.categories.push({ name: categoryName, goals });
      }
      continue;
    }

    // Parse tables
    if (line.includes("|")) {
      const cells = line.split("|").map((c) => c.trim());

      // Check if this is a table header
      if (cells.some((c) => c.includes("---"))) {
        inTable = true;
        continue;
      }

      if (inTable && currentSection === "pillars" && currentPillar) {
        // Skip header row
        if (cells[1]?.includes("---") || cells[1]?.toLowerCase().includes("domain")) continue;

        // Parse pillar items
        if (cells.length >= 4) {
          const name = cells[1] || "";
          const owner = cells[2] || "";
          const statusStr = cells[3] || "";
          const notes = cells[4] || "";

          let status: PillarItem["status"] = "not-started";
          if (statusStr.includes("✅")) status = "done";
          else if (statusStr.includes("🟡")) status = "in-progress";

          currentPillar.items.push({
            name: name.replace(/\*\*/g, "").trim(),
            owner: owner.replace(/\*\*/g, "").trim() || undefined,
            status,
            notes: notes.replace(/\*\*/g, "").trim() || undefined,
          });
        }
      } else if (inTable && currentSection === "evolution-log") {
        // Skip header row
        if (cells[1]?.toLowerCase().includes("date") || cells[1]?.includes("---")) continue;

        if (cells.length >= 4) {
          evolutionLog.push({
            date: cells[1]?.trim() || "",
            change: cells[2]?.trim() || "",
            impact: cells[3]?.trim() || "",
          });
        }
      }
      continue;
    }

    // Reset inTable if we're out of table
    if (!line.includes("|") && inTable) {
      inTable = false;
    }
  }

  // Don't forget the last pillar
  if (currentPillar) pillars.push(currentPillar);

  return { pillars, evolutionLog, quarterlyGoals };
}

// Parse LESSONS.md
function parseLessonsMarkdown(content: string): { total: number; recent: Lesson[] } {
  const lines = content.split("\n");
  const lessons: Lesson[] = [];

  let currentCategory = "";
  let currentLessonTitle = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect categories (## headings)
    const categoryMatch = line.match(/^## (.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }

    // Detect lesson patterns
    const lessonMatch = line.match(/^### Pattern: (.+)$/);
    if (lessonMatch) {
      currentLessonTitle = lessonMatch[1];
      continue;
    }

    // Look for the "Added:" date line after a pattern
    if (currentLessonTitle) {
      const dateMatch = line.match(/\*\*Added:\*\* (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        lessons.push({
          title: currentLessonTitle,
          category: currentCategory,
          date: dateMatch[1],
        });
        currentLessonTitle = "";
      }
    }
  }

  return {
    total: lessons.length,
    recent: lessons.slice(0, 5),
  };
}

// Calculate days active since migration date (Feb 3, 2026)
function calculateDaysActive(): number {
  const migrationDate = new Date("2026-02-03");
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - migrationDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export async function GET() {
  try {
    const workspacePath = "/Users/paulvillanueva/.openclaw/workspace";

    // Read EVOLUTION.md
    let evolutionContent = "";
    try {
      evolutionContent = await readFile(join(workspacePath, "EVOLUTION.md"), "utf-8");
    } catch (error) {
      console.error("Error reading EVOLUTION.md:", error);
    }

    // Read LESSONS.md
    let lessonsContent = "";
    try {
      lessonsContent = await readFile(join(workspacePath, "LESSONS.md"), "utf-8");
    } catch (error) {
      console.error("Error reading LESSONS.md:", error);
    }

    // Parse both files
    const { pillars, evolutionLog, quarterlyGoals } = parseEvolutionMarkdown(evolutionContent);
    const { total, recent } = parseLessonsMarkdown(lessonsContent);

    // Calculate stats
    const daysActive = calculateDaysActive();

    // Count agents configured from Agent Ecosystem pillar
    const agentsPillar = pillars.find((p) => p.emoji === "🤖");
    const agentsConfigured = agentsPillar?.items.length || 0;

    // Get costs and performance from existing APIs
    let totalCost = 0;
    let successRate = 100;

    try {
      const costsUrl = new URL("http://localhost:3001/api/costs");
      const costsResponse = await fetch(costsUrl);
      if (costsResponse.ok) {
        const costsData = await costsResponse.json();
        totalCost = costsData.thisMonth || 0;
      }
    } catch (error) {
      console.error("Error fetching costs:", error);
    }

    try {
      const perfUrl = new URL("http://localhost:3001/api/performance");
      const perfResponse = await fetch(perfUrl);
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        successRate = perfData.summary?.successRate || 100;
      }
    } catch (error) {
      console.error("Error fetching performance:", error);
    }

    const data: EvolutionData = {
      pillars,
      lessons: { total, recent },
      evolutionLog,
      quarterlyGoals,
      stats: {
        daysActive,
        lessonsLearned: total,
        totalCost,
        successRate,
        agentsConfigured,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in evolution API:", error);
    return NextResponse.json(
      { error: "Failed to fetch evolution data" },
      { status: 500 }
    );
  }
}
