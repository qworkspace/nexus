import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SHARED = process.env.HOME ? join(process.env.HOME, "shared") : "/Users/paulvillanueva/.openclaw/shared";
const MEETINGS_DIR = join(SHARED, "meetings");
const SUMMARIES_DIR = join(SHARED, "meetings", "summaries");

// Generate summary using Ollama
async function generateSummary(meetingId: string, content: string): Promise<string> {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b",
        prompt: `Summarize the following meeting transcript in 3 bullet points (max 5 words each). Capture key decisions and action items.

Meeting transcript:
${content.slice(0, 2000)}

Summary (3 bullet points):`,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 300,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "Summary not available";
  } catch (error) {
    console.error("Failed to generate summary:", error);

    // Fallback: extract first line from each speaker
    const speakers = content.split("\n").filter(l => l.includes("**") && l.includes(":**"));
    const firstLines = speakers.slice(0, 3).map(l => {
      const match = l.match(/\*\*([^*]+)\*\*:\s*(.+)/);
      return match ? `- ${match[1]}: ${match[2].slice(0, 50)}` : "";
    }).filter(Boolean);

    return firstLines.length > 0
      ? firstLines.join("\n")
      : "- Meeting summary unavailable";
  }
}

// Parse topics from transcript
function parseTopics(content: string): string[] {
  const topics: string[] = [];

  // Common project keywords
  const keywords = [
    "CryptoMon", "Nexus", "Cohera", "In House Volumes", "Paul Villanueva",
    "IHV", "website", "app", "design", "content", "marketing", "engineering",
    "standup", "sync", "release", "launch", "feature", "bug", "deadline",
  ];

  const lowerContent = content.toLowerCase();

  keywords.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase()) && !topics.includes(keyword)) {
      topics.push(keyword);
    }
  });

  // Also check for any words followed by "project" or "app"
  const projectMatches = lowerContent.match(/(\w+)\s+(?:project|app|feature)/g);
  if (projectMatches) {
    projectMatches.forEach(match => {
      const word = match.split(" ")[0];
      if (word.length > 3 && !topics.includes(word)) {
        topics.push(word.charAt(0).toUpperCase() + word.slice(1));
      }
    });
  }

  return topics.slice(0, 5); // Max 5 topics
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if cached summary exists
    try {
      const summaryPath = join(SUMMARIES_DIR, `${id}.md`);
      const cachedSummary = readFileSync(summaryPath, "utf-8");
      const topicsPath = join(SUMMARIES_DIR, `${id}.topics.json`);
      const cachedTopics = JSON.parse(readFileSync(topicsPath, "utf-8"));

      return NextResponse.json({ summary: cachedSummary, topics: cachedTopics, cached: true });
    } catch {
      // No cache, generate new summary
    }

    // Load meeting content
    const meetingPath = join(MEETINGS_DIR, `${id}.md`);
    const content = readFileSync(meetingPath, "utf-8");

    // Generate summary
    const summary = await generateSummary(id, content);

    // Parse topics
    const topics = parseTopics(content);

    // Cache summary
    try {
      // Ensure summaries directory exists
      mkdirSync(SUMMARIES_DIR, { recursive: true });
    } catch {
      // Directory already exists
    }

    // Write summary cache
    writeFileSync(join(SUMMARIES_DIR, `${id}.md`), summary, "utf-8");
    writeFileSync(join(SUMMARIES_DIR, `${id}.topics.json`), JSON.stringify(topics), "utf-8");

    return NextResponse.json({ summary, topics, cached: false });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary", detail: String(error) },
      { status: 500 }
    );
  }
}
