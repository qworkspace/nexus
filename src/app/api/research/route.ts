import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const DAILY_DIR = "/Users/paulvillanueva/shared/research/ai-intel/daily";

interface ResearchItem {
  date: string;
  title: string;
  scans: string[];
  critical: string[];
  notable: string[];
  highlights: string[];
  actions: string[];
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const limit = parseInt(searchParams.get("limit") || "5");

    let files: string[];
    try {
      files = readdirSync(DAILY_DIR)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .reverse()
        .slice(0, limit);
    } catch {
      files = [];
    }

    const research: ResearchItem[] = files.map((filename) => {
      const content = readFileSync(join(DAILY_DIR, filename), "utf-8");
      return parseResearchFile(filename, content);
    });

    return NextResponse.json({
      research,
      total: research.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching research:", error);
    return NextResponse.json(
      { error: "Failed to fetch research" },
      { status: 500 }
    );
  }
}

function parseResearchFile(filename: string, content: string): ResearchItem {
  const dateMatch = content.match(
    /^# AI Research Intel — (\d{4}-\d{2}-\d{2})$/m
  );
  const date = dateMatch ? dateMatch[1] : filename.replace(".md", "");

  const lines = content.split("\n");
  const scans: string[] = [];
  const critical: string[] = [];
  const notable: string[] = [];
  const highlights: string[] = [];
  const actions: string[] = [];

  let section = "";

  for (const line of lines) {
    if (line.startsWith("## Scan")) {
      const scanMatch = line.match(/Scan (\d{2}:\d{2})/);
      if (scanMatch) scans.push(scanMatch[1]);
      section = "scan";
      continue;
    }

    if (line.includes("🚨 Critical")) {
      section = "critical";
      continue;
    }
    if (line.includes("📡 Notable")) {
      section = "notable";
      continue;
    }
    if (line.includes("✅ Actions")) {
      section = "actions";
      continue;
    }
    if (line.startsWith("### ") || line.startsWith("## ")) {
      section = "highlights";
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract numbered items (1. **text**) or bullet items
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)/) ||
      trimmed.match(/^\d+\.\s+(.+)/);
    if (bulletMatch) {
      const item = bulletMatch[1]
        .replace(/\*\*/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .trim();

      if (!item) continue;

      switch (section) {
        case "critical":
          critical.push(item);
          break;
        case "notable":
          notable.push(item);
          break;
        case "actions":
          actions.push(item);
          break;
        default:
          highlights.push(item);
          break;
      }
    }
  }

  return {
    date,
    title: `Research Intel — ${date}`,
    scans,
    critical,
    notable,
    highlights: highlights.slice(0, 5),
    actions,
  };
}
