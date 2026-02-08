import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface MemoryChunk {
  id: string;
  content: string;
  similarity: number;
  metadata: {
    source: string;
    type: string;
    chunk_index: number;
    total_chunks: number;
  };
  created_at: string;
}

interface SearchResponse {
  results: MemoryChunk[];
  query: string;
  count: number;
}

async function searchMemory(query: string, limit: number = 10, minScore: number = 0.3): Promise<SearchResponse> {
  try {
    // Call q-memory CLI
    const { stdout, stderr } = await execAsync(
      `python3 ~/.openclaw/workspace/tools/memory-api/q-memory search "${query.replace(/"/g, '\\"')}" -k ${limit}`
    );

    if (stderr && !stdout) {
      console.error("q-memory search error:", stderr);
      return { results: [], query, count: 0 };
    }

    // Parse the output
    const lines = stdout.split('\n');
    const results: MemoryChunk[] = [];
    let currentChunk: Partial<MemoryChunk> | null = null;

    for (const line of lines) {
      // Match result header: "1. [62.52%] """ MemoryService..."
      const resultMatch = line.match(/^\d+\.\s+\[([\d.]+)%\]\s+(.*)/);
      if (resultMatch) {
        if (currentChunk && currentChunk.content && currentChunk.similarity && currentChunk.similarity >= minScore) {
          results.push(currentChunk as MemoryChunk);
        }
        currentChunk = {
          similarity: parseFloat(resultMatch[1]) / 100,
          content: resultMatch[2],
          metadata: {
            source: "",
            type: "file",
            chunk_index: 0,
            total_chunks: 1,
          },
        };
        continue;
      }

      if (!currentChunk) continue;

      // Match ID: "   ID: 614da2570aa12728"
      const idMatch = line.match(/^\s+ID:\s+(.+)$/);
      if (idMatch) {
        currentChunk.id = idMatch[1];
        continue;
      }

      // Match Created: "   Created: 2026-02-08T01:59:13.420052"
      const createdMatch = line.match(/^\s+Created:\s+(.+)$/);
      if (createdMatch) {
        currentChunk.created_at = createdMatch[1];
        continue;
      }

      // Match Metadata: "   Metadata: { ... }"
      const metadataMatch = line.match(/^\s+Metadata:\s+(\{.*\})$/);
      if (metadataMatch) {
        try {
          currentChunk.metadata = JSON.parse(metadataMatch[1]);
        } catch {
          console.error("Failed to parse metadata:", metadataMatch[1]);
        }
        continue;
      }

      // Append multi-line content
      if (line.trim().startsWith('"') || line.trim().startsWith('"""') || line.trim().startsWith('**')) {
        currentChunk.content += '\n' + line.trim();
      }
    }

    // Don't forget the last chunk
    if (currentChunk && currentChunk.content && currentChunk.similarity !== undefined && currentChunk.similarity >= minScore) {
      results.push(currentChunk as MemoryChunk);
    }

    return { results, query, count: results.length };
  } catch (error) {
    console.error("Failed to search memory:", error);
    return { results: [], query, count: 0 };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "10");
  const minScore = parseFloat(searchParams.get("minScore") || "0.3");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  const result = await searchMemory(query, limit, minScore);
  return NextResponse.json(result);
}
