import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/spec-briefs";
const STATUS_FILE = "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/idea-status.json";

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
  sourceResearchId?: string;
  sourceModel?: string;
  sourceDate?: string;
  sourceTitle?: string;
  rating?: 'excellent' | 'good' | 'neutral' | 'poor';
  ratedAt?: string;
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
  sourceResearchId?: string;
  sourceModel?: string;
  sourceDate?: string;
  sourceTitle?: string;
  category: 'research' | 'think' | 'request' | 'review';
  keyInsight?: string;
  proposedBuild?: string[];
  impact?: string[];
  oneLiner?: string;
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

  // Extract source and model from content (BEFORE statusEntry overrides)
  const sourceMatch = content.match(/\*\*Source:\*\*\s*(.+?)(?:\n|$)/);
  const modelMatch = content.match(/\*\*Model:\*\*\s*(.+?)(?:\n|$)/);
  
  // Clean source: strip dates and descriptions (e.g. "PJ review (2026-02-14) — long description" → "PJ review")
  let sourceTitle = sourceMatch ? sourceMatch[1].trim()
    .replace(/\s*[—–-]\s+.*$/, '')         // Strip " — description" or " - description"
    .replace(/\s*\(?\d{4}-\d{2}-\d{2}(?:-\d{4})?\)?/, '')  // Strip dates
    .replace(/\s*\(\s*\)$/, '')             // Strip empty parens
    .trim() : undefined;
  if (sourceTitle === '') sourceTitle = undefined;
  const sourceModel = modelMatch ? modelMatch[1].trim() : undefined;

  // Extract date with priority: filename → content → file mtime → now
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  let createdAt: string;
  if (dateMatch) {
    createdAt = `${dateMatch[1]}T00:00:00Z`;
  } else {
    // Try to extract from content **Created:** field
    const contentDateMatch = content.match(/\*\*Created:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    if (contentDateMatch) {
      createdAt = `${contentDateMatch[1]}T00:00:00Z`;
    } else {
      // Fall back to file modification time
      try {
        createdAt = statSync(path).mtime.toISOString();
      } catch {
        createdAt = new Date().toISOString();
      }
    }
  }

  // Helper to clean markdown formatting
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic
      .replace(/^#+\s*/gm, '') // Remove headers
      .trim();
  };

  // Helper to validate extracted content
  const isValidContent = (text: string): boolean => {
    if (!text || text.length < 30) return false;
    if (text.startsWith('#') || text.startsWith('**') || text.startsWith('-') || text.startsWith('*')) return false;
    return true;
  };

  // STRICT extraction: only extract if proper section headers exist
  // keyInsight: Match new headers (Key Insight) OR old headers (Problem) for backwards compat
  let keyInsight = '';
  const keyInsightSection = content.match(/##\s*(?:Key\s+Insights?|Problem(?:\s+Statement)?)\s*\n([\s\S]+?)(?=##|$)/i);
  if (keyInsightSection) {
    const raw = keyInsightSection[1].split('\n').map(l => l.trim()).filter(l => l.length > 0)[0] || '';
    const cleaned = cleanMarkdown(raw);
    if (isValidContent(cleaned)) {
      keyInsight = cleaned;
    }
  }

  // Extract proposedBuild lines (up to 5 meaningful lines)
  // Match new headers (Proposed Build) OR old headers (Solution) for backwards compat
  const proposedBuildSection = content.match(/##\s*(?:Proposed\s+Build|Proposed\s+Solution|Solution)\s*\n([\s\S]+?)(?=##|$)/i);
  let proposedBuild: string[] = [];
  if (proposedBuildSection) {
    proposedBuild = proposedBuildSection[1]
      .split('\n')
      .map(l => l.replace(/^\s*[-*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim())
      .filter(l => l.length > 15 && !l.startsWith('#'))
      .slice(0, 5);
  }

  // Extract impact lines (up to 5 meaningful lines)
  const impactSection = content.match(/##\s*(?:Why This Matters|Impact|Benefits)\s*\n([\s\S]+?)(?=##|$)/i);
  let impact: string[] = [];
  if (impactSection) {
    impact = impactSection[1]
      .split('\n')
      .map(l => l.replace(/^\s*[-*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim())
      .filter(l => l.length > 15 && !l.startsWith('#'))
      .slice(0, 5);
  }

  // Extract oneLiner: first meaningful paragraph from entire document (fallback)
  const lines = content.split('\n')
    .map(l => l.trim())
    .filter(l => 
      l.length > 30 && 
      !l.startsWith('#') && 
      !l.startsWith('**') && 
      !l.startsWith('---') && 
      !l.startsWith('-') && 
      !l.startsWith('*')
    );
  const oneLiner = lines[0] || '';

  // Derive category from sourceTitle
  const effectiveSourceTitle = (statusEntry.sourceTitle || sourceTitle || '').toLowerCase();
  let category: 'research' | 'think' | 'request' | 'review' = 'research';
  
  if (effectiveSourceTitle.includes('request')) {
    category = 'request';
  } else if (effectiveSourceTitle.includes('review') || effectiveSourceTitle.includes('feedback')) {
    category = 'review';
  } else if (effectiveSourceTitle.includes('innovation') || effectiveSourceTitle.includes('think') || effectiveSourceTitle.includes('deep')) {
    category = 'think';
  } else if (effectiveSourceTitle.includes("what's new") || effectiveSourceTitle.includes('scan')) {
    category = 'research';
  }

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
    sourceResearchId: statusEntry.sourceResearchId,
    sourceModel: statusEntry.sourceModel || sourceModel,
    sourceDate: statusEntry.sourceDate,
    sourceTitle: statusEntry.sourceTitle || sourceTitle,
    category,
    keyInsight,
    proposedBuild,
    impact,
    oneLiner,
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
    const { id, action, rating } = body;

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
        if (rating) {
          entry.rating = rating;
          entry.ratedAt = new Date().toISOString();
        }
        break;
      case "park":
        entry.status = "parked";
        if (rating) {
          entry.rating = rating;
          entry.ratedAt = new Date().toISOString();
        }
        break;
      case "reject":
        entry.status = "rejected";
        if (rating) {
          entry.rating = rating;
          entry.ratedAt = new Date().toISOString();
        }
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
      rating: entry.rating,
      ratedAt: entry.ratedAt,
    });
  } catch (error) {
    console.error("Error updating brief status:", error);
    return NextResponse.json(
      { error: "Failed to update brief status" },
      { status: 500 }
    );
  }
}
