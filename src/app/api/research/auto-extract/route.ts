import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/spec-briefs";
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
  createdAt?: string;
  specPath?: string;
  buildStatus?: BriefStatus;
  buildId?: string;
  shippedAt?: string;
  reviewOutcome?: "success" | "partial" | "failed";
  reviewNote?: string;
  reviewedAt?: string;
  sourceUrl?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, content, title, sourceUrl } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 }
      );
    }

    // Extract actionable findings from research
    const bullets = extractActionableBullets(content);

    // Create draft brief only if we have actionable findings
    if (bullets.length < 3) {
      return NextResponse.json({
        success: false,
        reason: `Insufficient actionable findings (${bullets.length} bullets, need at least 3)`,
        bulletsCount: bullets.length,
      });
    }

    const briefId = await createAutoBrief(title, bullets, type, sourceUrl);
    return NextResponse.json({
      success: true,
      briefId,
      bulletsCount: bullets.length,
    });
  } catch (error) {
    console.error("Error auto-extracting brief:", error);
    return NextResponse.json(
      { error: "Failed to extract brief" },
      { status: 500 }
    );
  }
}

function extractActionableBullets(content: string): string[] {
  const lines = content.split("\n").filter(l => l.trim());
  const bullets: string[] = [];

  // Strategy 1: Extract from specific sections
  const foundKeys = new Set([
    "key findings",
    "takeaways",
    "action items",
    "benefits",
    "metrics",
    "why this matters",
    "what we learned",
    "recommendations"
  ]);

  let inSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();

    // Check if we're entering a relevant section
    if (foundKeys.has(lower.replace(/[:#]/g, ""))) {
      inSection = true;
      continue;
    }

    // Exit section if we hit a new header
    if (inSection && line.startsWith("#")) {
      inSection = false;
      continue;
    }

    // Extract bullets from this section
    if (inSection) {
      if (line.startsWith("-") || line.startsWith("*")) {
        bullets.push(line.slice(1).trim());
      } else if (line.match(/^\d+\./)) {
        bullets.push(line.replace(/^\d+\.\s*/, ""));
      } else if (line.length > 30 && !line.startsWith("#")) {
        // Longer lines that aren't headers might be bullets
        bullets.push(line);
      }
    }

    // Stop if we have enough bullets
    if (bullets.length >= 5) {
      break;
    }
  }

  // Strategy 2: Look for bullet-like patterns throughout the document
  if (bullets.length < 3) {
    for (const line of lines) {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        bullets.push(line.slice(2).trim());
      }
      if (bullets.length >= 5) {
        break;
      }
    }
  }

  // Strategy 3: Fallback to sentence extraction
  if (bullets.length < 3) {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    // Take sentences that are long enough to be meaningful
    const meaningfulSentences = sentences
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 200);

    bullets.push(...meaningfulSentences.slice(0, 5));
  }

  // Deduplicate and clean bullets
  const uniqueBullets = Array.from(new Set(
    bullets
      .map(b => b.trim())
      .filter(b => b.length > 10 && b.length < 500)
  ));

  return uniqueBullets.slice(0, 5);
}

async function createAutoBrief(
  title: string,
  bullets: string[],
  type: string,
  sourceUrl?: string
): Promise<string> {
  const id = randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `${timestamp}-${id}.md`;

  // Generate brief content
  const content = `# Spec Brief: ${title}

**Source:** ${type}
**Priority:** MED
**Created:** ${new Date().toISOString()}

## Problem Statement

Auto-generated brief from research output.

## Why This Matters (Benefits)

${bullets.map(b => `  - ${b}`).join("\n")}

## Success Metrics

  - (To be defined)

## Proposed Solution

(To be defined during spec creation)

## Notes

Auto-extracted from ${type} research.
`;

  const filepath = join(SPEC_BRIEFS_DIR, filename);
  writeFileSync(filepath, content, "utf-8");

  // Update status
  const statusMap = loadStatusMap();
  statusMap.set(filename, {
    status: "new",
    title,
    bullets,
    priority: "MED",
    complexity: "MED",
    createdAt: new Date().toISOString(),
    sourceUrl,
  });
  saveStatusMap(statusMap);

  return id;
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
