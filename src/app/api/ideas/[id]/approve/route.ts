import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const dynamic = "force-dynamic";

const STATUS_FILE = "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/idea-status.json";

type BriefStatus = "new" | "approved" | "parked" | "rejected" | "specced" | "building" | "shipped" | "review";

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
  rating?: 'excellent' | 'good' | 'neutral' | 'poor';
  ratedAt?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, bullets, priority, complexity, notes, rating } = body;

    const filename = `${id}.md`;
    const statusMap = loadStatusMap();

    if (!statusMap.has(filename)) {
      statusMap.set(filename, { status: "new" });
    }

    const entry = statusMap.get(filename)!;

    // Update brief details from edit form
    if (title) {
      entry.title = title;
    }
    if (bullets && Array.isArray(bullets)) {
      entry.bullets = bullets;
    }
    if (priority) {
      entry.priority = priority;
    }
    if (complexity) {
      entry.complexity = complexity;
    }
    if (notes !== undefined) {
      entry.notes = notes;
    }

    // Mark as approved
    entry.status = "approved";
    entry.approvedAt = new Date().toISOString();

    // Save rating if provided
    if (rating) {
      entry.rating = rating;
      entry.ratedAt = new Date().toISOString();
    }

    // Create next status
    if (entry.specPath) {
      entry.buildStatus = "specced";
      entry.buildId = generateBuildId();
    }

    saveStatusMap(statusMap);

    return NextResponse.json({
      id,
      filename,
      status: entry.status,
      approvedAt: entry.approvedAt,
      title: entry.title,
      bullets: entry.bullets,
      priority: entry.priority,
      complexity: entry.complexity,
      notes: entry.notes,
      rating: entry.rating,
      ratedAt: entry.ratedAt,
    });
  } catch (error) {
    console.error("Error approving brief:", error);
    return NextResponse.json(
      { error: "Failed to approve brief" },
      { status: 500 }
    );
  }
}

function generateBuildId(): string {
  return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

function saveStatusMap(map: Map<string, BriefStatusEntry>) {
  const data: Record<string, BriefStatusEntry> = {};

  for (const [filename, entry] of map.entries()) {
    data[filename] = entry;
  }

  writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}
