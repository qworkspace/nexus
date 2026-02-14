import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/shared/research/ai-intel/spec-briefs";
const STATUS_FILE = "/Users/paulvillanueva/shared/research/ai-intel/idea-status.json";

type BriefStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";

interface BriefSummary {
  idea?: string;
  title?: string;
  summary?: string;
  benefits?: string[];
  successMetrics?: string[];
  notes?: string;
  keyFindings?: string[];
  tags?: string[];
  priority?: string;
  generatedAt?: string;
}

interface BriefStatusEntry {
  status: BriefStatus;
  title?: string;
  bullets?: string[];
  priority?: "HIGH" | "MED" | "LOW";
  complexity?: "LOW" | "MED" | "HIGH";
  notes?: string;
  approvedAt?: string;
  specPath?: string;
  buildStatus?: BriefStatus;
  buildId?: string;
  shippedAt?: string;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
  sourceUrl?: string;
}

interface BriefItem {
  id: string;
  filename: string;
  title: string;
  bullets: string[];
  priority: "HIGH" | "MED" | "LOW";
  complexity: "LOW" | "MED" | "HIGH";
  status: BriefStatus;
  createdAt: string;
  sourceUrl?: string;
  notes?: string;
  summary?: BriefSummary;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
}

interface BriefStats {
  total: number;
  new: number;
  approved: number;
  parked: number;
  rejected: number;
  specced: number;
  building: number;
  shipped: number;
  review: number;
  approvalRate: number;
  avgTimeToShip: string;
  complexityBreakdown: { LOW: number; MED: number; HIGH: number };
  priorityBreakdown: { LOW: number; MED: number; HIGH: number };
}

interface BriefsResponse {
  briefs: BriefItem[];
  stats: BriefStats;
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const status = searchParams.get("status") as BriefStatus | null;

    const briefs = await getBriefs();
    const stats = calculateStats(briefs);

    const filtered = status
      ? briefs.filter((brief) => brief.status === status)
      : briefs;

    return NextResponse.json({
      briefs: filtered,
      stats,
    } as BriefsResponse);
  } catch (error) {
    console.error("Error fetching briefs:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 }
    );
  }
}

async function getBriefs(): Promise<BriefItem[]> {
  const briefs: BriefItem[] = [];
  const statusMap = loadStatusMap();

  if (!existsSync(SPEC_BRIEFS_DIR)) {
    return briefs;
  }

  const files = readdirSync(SPEC_BRIEFS_DIR)
    .filter((f) => f.endsWith(".md") && !f.endsWith(".processed"))
    .sort()
    .reverse();

  for (const filename of files) {
    const filepath = join(SPEC_BRIEFS_DIR, filename);
    const content = readFileSync(filepath, "utf-8");
    const statusEntry = statusMap.get(filename) || { status: "new" as BriefStatus };

    // Load summary.json if it exists
    const summaryPath = filepath.replace(".md", ".summary.json");
    let summary: BriefSummary | undefined = undefined;
    if (existsSync(summaryPath)) {
      try {
        const summaryContent = readFileSync(summaryPath, "utf-8");
        summary = JSON.parse(summaryContent) as BriefSummary;
      } catch (error) {
        console.error(`Error loading summary for ${filename}:`, error);
      }
    }

    const parsed = parseSpecBrief(filename, content, filepath, statusEntry, summary);

    // Add review fields from status entry
    if (statusEntry.reviewOutcome) {
      parsed.reviewOutcome = statusEntry.reviewOutcome;
      parsed.reviewNote = statusEntry.reviewNote;
      parsed.reviewedAt = statusEntry.reviewedAt;
    }

    briefs.push(parsed);
  }

  return briefs;
}

function parseSpecBrief(
  filename: string,
  content: string,
  path: string,
  statusEntry: BriefStatusEntry,
  summary?: BriefSummary
): BriefItem {
  const id = filename.replace(".md", "");

  // Extract title from Spec Brief: or first #
  const titleMatch = content.match(/(?:^# Spec Brief:\s+(.+)$|^#\s+(.+)$)/m);
  const title = statusEntry.title || (titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : id);

  // Extract bullets from Benefits section or summary
  let bullets: string[] = statusEntry.bullets || [];

  if (bullets.length === 0) {
    // Try to extract from benefits section
    const benefitsMatch = content.match(/##\s*Why This Matters.*?\n([\s\S]+?)(?=##|$)/i);
    if (benefitsMatch) {
      bullets = benefitsMatch[1]
        .split("\n")
        .map(line => line.replace(/^\s*-\s*/, "").trim())
        .filter(line => line.length > 0);
    }

    // Fallback to summary
    if (bullets.length === 0 && summary) {
      bullets = summary.benefits || summary.keyFindings || [];
    }

    // Last resort: extract from content
    if (bullets.length === 0) {
      const problemMatch = content.match(/##\s*Problem Statement\s*\n([\s\S]+?)(?=##|$)/i);
      if (problemMatch) {
        bullets = problemMatch[1]
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 20)
          .slice(0, 5);
      }
    }
  }

  // Extract priority from frontmatter or **Priority:**
  const priorityMatch = content.match(/\*\*Priority:\*\*\s*(HIGH|MED|LOW)/i) ||
                         content.match(/priority:\s*(HIGH|MED|LOW)/i);
  const priority = (statusEntry.priority || priorityMatch?.[1]?.toUpperCase() || "MED") as "HIGH" | "MED" | "LOW";

  // Extract complexity from content or status entry
  const complexityMatch = content.match(/complexity:\s*(LOW|MED|HIGH)/i);
  const complexity = (statusEntry.complexity || complexityMatch?.[1]?.toUpperCase() || "MED") as "LOW" | "MED" | "HIGH";

  // Extract date from filename
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  const createdAt = dateMatch ? `${dateMatch[1]}T00:00:00Z` : new Date().toISOString();

  return {
    id,
    filename,
    title,
    bullets,
    priority,
    complexity,
    status: statusEntry.status,
    createdAt,
    sourceUrl: statusEntry.sourceUrl,
    notes: statusEntry.notes,
    summary,
  };
}

function loadStatusMap(): Map<string, BriefStatusEntry> {
  const map = new Map<string, BriefStatusEntry>();

  if (!existsSync(STATUS_FILE)) {
    return map;
  }

  try {
    const content = readFileSync(STATUS_FILE, "utf-8");
    const data = JSON.parse(content);

    for (const [filename, entry] of Object.entries(data)) {
      map.set(filename, entry as BriefStatusEntry);
    }
  } catch (error) {
    console.error("Error loading status map:", error);
  }

  return map;
}

function calculateStats(briefs: BriefItem[]): BriefStats {
  const stats = {
    total: briefs.length,
    new: 0,
    approved: 0,
    parked: 0,
    rejected: 0,
    specced: 0,
    building: 0,
    shipped: 0,
    review: 0,
    approvalRate: 0,
    avgTimeToShip: "N/A",
    complexityBreakdown: { LOW: 0, MED: 0, HIGH: 0 },
    priorityBreakdown: { LOW: 0, MED: 0, HIGH: 0 },
  };

  for (const brief of briefs) {
    const s = brief.status;
    switch (s) {
      case "new":
        stats.new++;
        break;
      case "approved":
        stats.approved++;
        break;
      case "parked":
        stats.parked++;
        break;
      case "rejected":
        stats.rejected++;
        break;
      case "specced":
        stats.specced++;
        break;
      case "building":
        stats.building++;
        break;
      case "shipped":
        stats.shipped++;
        break;
      case "review":
        stats.review++;
        break;
    }

    // Track complexity
    stats.complexityBreakdown[brief.complexity]++;

    // Track priority
    stats.priorityBreakdown[brief.priority]++;
  }

  // Calculate approval rate
  if (stats.total > 0) {
    stats.approvalRate = stats.approved / stats.total;
  }

  // Calculate average time to ship
  const shipped = briefs.filter(b => b.status === "shipped");
  if (shipped.length > 0) {
    const totalTime = shipped.reduce((sum, b) => {
      const created = new Date(b.createdAt).getTime();
      const statusMap = loadStatusMap();
      const statusEntry = statusMap.get(b.filename);
      const shippedDate = statusEntry?.shippedAt ? new Date(statusEntry.shippedAt).getTime() : Date.now();
      return sum + (shippedDate - created);
    }, 0);

    const avgMs = totalTime / shipped.length;
    stats.avgTimeToShip = formatTime(avgMs);
  }

  return stats;
}

function formatTime(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

function saveStatusMap(map: Map<string, BriefStatusEntry>) {
  const data: Record<string, BriefStatusEntry> = {};

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
    console.error("Error updating brief status:", error);
    return NextResponse.json(
      { error: "Failed to update brief status" },
      { status: 500 }
    );
  }
}
