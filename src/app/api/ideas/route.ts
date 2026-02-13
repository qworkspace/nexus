import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/shared/research/ai-intel/spec-briefs";
const STATUS_FILE = "/Users/paulvillanueva/shared/research/ai-intel/idea-status.json";

type IdeaStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped";

interface IdeaStatusEntry {
  status: IdeaStatus;
  approvedAt?: string;
  specPath?: string;
  buildStatus?: IdeaStatus;
  buildId?: string;
  shippedAt?: string;
}

interface IdeaItem {
  id: string;
  filename: string;
  title: string;
  problem: string;
  solution: string;
  priority: string;
  complexity: string;
  status: IdeaStatus;
  createdAt: string;
  path: string;
}

interface IdeasResponse {
  ideas: IdeaItem[];
  stats: {
    total: number;
    new: number;
    approved: number;
    parked: number;
    rejected: number;
    specced: number;
    building: number;
    shipped: number;
  };
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const status = searchParams.get("status") as IdeaStatus | null;

    const ideas = await getIdeas();
    const stats = calculateStats(ideas);

    const filtered = status
      ? ideas.filter((idea) => idea.status === status)
      : ideas;

    return NextResponse.json({
      ideas: filtered,
      stats,
    } as IdeasResponse);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

async function getIdeas(): Promise<IdeaItem[]> {
  const ideas: IdeaItem[] = [];
  const statusMap = loadStatusMap();

  if (!existsSync(SPEC_BRIEFS_DIR)) {
    return ideas;
  }

  const files = readdirSync(SPEC_BRIEFS_DIR)
    .filter((f) => f.endsWith(".md") && !f.endsWith(".processed"))
    .sort()
    .reverse();

  for (const filename of files) {
    const filepath = join(SPEC_BRIEFS_DIR, filename);
    const content = readFileSync(filepath, "utf-8");
    const status = statusMap.get(filename)?.status || "new";

    const parsed = parseSpecBrief(filename, content, filepath, status);
    ideas.push(parsed);
  }

  return ideas;
}

function parseSpecBrief(
  filename: string,
  content: string,
  path: string,
  status: IdeaStatus
): IdeaItem {
  const id = filename.replace(".md", "");

  // Extract title from Spec Brief: or first #
  const titleMatch = content.match(/(?:^# Spec Brief:\s+(.+)$|^#\s+(.+)$)/m);
  const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : id;

  // Extract priority from frontmatter or **Priority:**
  const priorityMatch = content.match(/\*\*Priority:\*\*\s*(HIGH|MED|LOW)/i) ||
                         content.match(/priority:\s*(HIGH|MED|LOW)/i);
  const priority = priorityMatch ? priorityMatch[1].toUpperCase() : "MED";

  // Extract complexity from content
  const complexityMatch = content.match(/complexity:\s*(LOW|MED|HIGH)/i);
  const complexity = complexityMatch ? complexityMatch[1].toUpperCase() : "MED";

  // Extract problem
  const problemMatch = content.match(/##\s*Problem\s*\n([\s\S]+?)(?=##|$)/i) ||
                        content.match(/\*\*Problem:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
  const problem = problemMatch
    ? problemMatch[1].trim().slice(0, 200) + (problemMatch[1].length > 200 ? "..." : "")
    : "No problem defined";

  // Extract solution
  const solutionMatch = content.match(/##\s*Solution\s*\n([\s\S]+?)(?=##|$)/i) ||
                        content.match(/\*\*Solution:\*\*\s*([\s\S]+?)(?=\*\*|$)/i);
  const solution = solutionMatch
    ? solutionMatch[1].trim().slice(0, 200) + (solutionMatch[1].length > 200 ? "..." : "")
    : "No solution defined";

  // Extract date from filename
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  const createdAt = dateMatch ? `${dateMatch[1]}T00:00:00Z` : new Date().toISOString();

  return {
    id,
    filename,
    title,
    problem,
    solution,
    priority,
    complexity,
    status,
    createdAt,
    path,
  };
}

function loadStatusMap(): Map<string, IdeaStatusEntry> {
  const map = new Map<string, IdeaStatusEntry>();

  if (!existsSync(STATUS_FILE)) {
    return map;
  }

  try {
    const content = readFileSync(STATUS_FILE, "utf-8");
    const data = JSON.parse(content);

    for (const [filename, entry] of Object.entries(data)) {
      map.set(filename, entry as IdeaStatusEntry);
    }
  } catch (error) {
    console.error("Error loading status map:", error);
  }

  return map;
}

function calculateStats(ideas: IdeaItem[]) {
  const stats = {
    total: ideas.length,
    new: 0,
    approved: 0,
    parked: 0,
    rejected: 0,
    specced: 0,
    building: 0,
    shipped: 0,
  };

  for (const idea of ideas) {
    const s = idea.status;
    if (s in stats) {
      stats[s as keyof typeof stats] = (stats[s as keyof typeof stats] as number) + 1;
    }
  }

  return stats;
}

function saveStatusMap(map: Map<string, IdeaStatusEntry>) {
  const data: Record<string, IdeaStatusEntry> = {};

  for (const [filename, entry] of map.entries()) {
    data[filename] = entry;
  }

  writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing id or action" },
        { status: 400 }
      );
    }

    const filename = `${id}.md`;
    const statusMap = loadStatusMap();

    if (!statusMap.has(filename)) {
      statusMap.set(filename, { status: "new" });
    }

    const entry = statusMap.get(filename)!;

    switch (action) {
      case "approve":
        entry.status = "approved";
        entry.approvedAt = new Date().toISOString();
        break;
      case "park":
        entry.status = "parked";
        break;
      case "reject":
        entry.status = "rejected";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    saveStatusMap(statusMap);

    return NextResponse.json({
      id,
      status: entry.status,
      approvedAt: entry.approvedAt,
    });
  } catch (error) {
    console.error("Error updating idea status:", error);
    return NextResponse.json(
      { error: "Failed to update idea status" },
      { status: 500 }
    );
  }
}
