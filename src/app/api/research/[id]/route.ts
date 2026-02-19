import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const RESEARCH_DIRS = [
  "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/deep-focus",
  "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/whats-new",
  "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/spec-briefs",
  "/Users/paulvillanueva/.openclaw/shared/research/ai-intel/specs",
];

interface ResearchDetailResponse {
  id: string;
  type: string;
  title: string;
  content: string;
  date: string;
  path: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Search in all directories
    for (const dir of RESEARCH_DIRS) {
      const filepath = join(dir, `${id}.md`);
      if (existsSync(filepath)) {
        const content = readFileSync(filepath, "utf-8");

        // Extract title
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : id;

        // Extract date
        const dateMatch = id.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? `${dateMatch[1]}T00:00:00Z` : new Date().toISOString();

        // Determine type
        let type = "unknown";
        if (dir.includes("deep-focus")) type = "deep-focus";
        else if (dir.includes("whats-new")) type = "whats-new";
        else if (dir.includes("spec-briefs")) type = "spec-briefs";
        else if (dir.includes("specs")) type = "specs";

        return NextResponse.json({
          id,
          type,
          title,
          content,
          date,
          path: filepath,
        } as ResearchDetailResponse);
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching research detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch research" },
      { status: 500 }
    );
  }
}
