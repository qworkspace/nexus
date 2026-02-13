import { NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const DEEP_FOCUS_DIR = "/Users/paulvillanueva/shared/research/ai-intel/deep-focus";
const WHATS_NEW_DIR = "/Users/paulvillanueva/shared/research/ai-intel/whats-new";
const SPEC_BRIEFS_DIR = "/Users/paulvillanueva/shared/research/ai-intel/spec-briefs";
const SPECS_DIR = "/Users/paulvillanueva/shared/research/ai-intel/specs";

type ResearchType = "deep-focus" | "whats-new" | "spec-briefs" | "specs";

interface ResearchItem {
  id: string;
  type: ResearchType;
  title: string;
  date: string;
  path: string;
  snippet: string;
  frontmatter?: Record<string, string | string[]>;
}

interface ResearchResponse {
  research: ResearchItem[];
  total: number;
  filtered: number;
  lastUpdated: string;
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get("type") as ResearchType | null;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const allItems = await getAllResearch();

    // Filter by type
    let filtered = type
      ? allItems.filter((item) => item.type === type)
      : allItems;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.snippet.toLowerCase().includes(searchLower)
      );
    }

    const total = allItems.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      research: paginated,
      total,
      filtered: filtered.length,
      lastUpdated: new Date().toISOString(),
    } as ResearchResponse);
  } catch (error) {
    console.error("Error fetching research:", error);
    return NextResponse.json(
      { error: "Failed to fetch research" },
      { status: 500 }
    );
  }
}

async function getAllResearch(): Promise<ResearchItem[]> {
  const items: ResearchItem[] = [];

  // Deep Focus files
  if (existsSync(DEEP_FOCUS_DIR)) {
    const files = readdirSync(DEEP_FOCUS_DIR)
      .filter((f) => f.endsWith(".md") && !f.endsWith(".processed"))
      .sort()
      .reverse();

    for (const filename of files) {
      const filepath = join(DEEP_FOCUS_DIR, filename);
      const content = readFileSync(filepath, "utf-8");
      items.push(parseResearchFile(filename, content, "deep-focus", filepath));
    }
  }

  // What's New files
  if (existsSync(WHATS_NEW_DIR)) {
    const files = readdirSync(WHATS_NEW_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();

    for (const filename of files) {
      const filepath = join(WHATS_NEW_DIR, filename);
      const content = readFileSync(filepath, "utf-8");
      items.push(parseResearchFile(filename, content, "whats-new", filepath));
    }
  }

  // Spec Briefs files
  if (existsSync(SPEC_BRIEFS_DIR)) {
    const files = readdirSync(SPEC_BRIEFS_DIR)
      .filter((f) => f.endsWith(".md") && !f.endsWith(".processed"))
      .sort()
      .reverse();

    for (const filename of files) {
      const filepath = join(SPEC_BRIEFS_DIR, filename);
      const content = readFileSync(filepath, "utf-8");
      items.push(parseResearchFile(filename, content, "spec-briefs", filepath));
    }
  }

  // Specs files
  if (existsSync(SPECS_DIR)) {
    const files = readdirSync(SPECS_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();

    for (const filename of files) {
      const filepath = join(SPECS_DIR, filename);
      const content = readFileSync(filepath, "utf-8");
      items.push(parseResearchFile(filename, content, "specs", filepath));
    }
  }

  // Sort by date
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

function parseResearchFile(
  filename: string,
  content: string,
  type: ResearchType,
  path: string
): ResearchItem {
  // Extract ID from filename (remove .md)
  const id = filename.replace(".md", "");

  // Extract title from first # heading or filename
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : id;

  // Extract date from filename (YYYY-MM-DD-HHMM format)
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? `${dateMatch[1]}T00:00:00Z` : new Date().toISOString();

  // Extract snippet (first paragraph or first line after title)
  const lines = content.split("\n").filter((l) => l.trim());
  let snippet = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("#") && line.length > 10) {
      snippet = line.slice(0, 150) + (line.length > 150 ? "..." : "");
      break;
    }
  }

  // Extract frontmatter (simple YAML-like parsing)
  const frontmatter: Record<string, string | string[]> = {};
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (frontmatterMatch) {
    const lines = frontmatterMatch[1].split("\n");
    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length) {
        const value = valueParts.join(":").trim().replace(/^["']|["']$/g, "");
        frontmatter[key.trim()] = value;
      }
    }
  }

  return {
    id,
    type,
    title,
    date,
    path,
    snippet,
    frontmatter,
  };
}
