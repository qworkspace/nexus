import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

interface FileInfo {
  path: string;
  title: string;
  content: string;
  category: "memory" | "docs" | "project";
}

// Paths to scan for searchable content
const SEARCH_PATHS = [
  { dir: "~/.openclaw/workspace/memory", category: "memory" as const },
  { dir: "~/.openclaw/workspace/docs", category: "docs" as const },
  { dir: "~/projects", category: "project" as const },
];

function expandPath(p: string): string {
  return p.replace(/^~/, process.env.HOME || "");
}

async function extractTitle(content: string, filePath: string): Promise<string> {
  // Try to get title from first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1];

  // Fall back to filename
  return path.basename(filePath, path.extname(filePath));
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const expandedDir = expandPath(dir);

  try {
    const entries = await fs.readdir(expandedDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(expandedDir, entry.name);

      // Skip node_modules, .git, etc.
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name === ".next"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recurse into subdirectories (limit depth for projects)
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist, skip
    console.log(`Skipping ${dir}: ${error}`);
  }

  return files;
}

async function readFileContent(filePath: string): Promise<FileInfo | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const title = await extractTitle(content, filePath);

    // Determine category from path
    let category: "memory" | "docs" | "project" = "project";
    if (filePath.includes("memory")) category = "memory";
    else if (filePath.includes("docs")) category = "docs";

    return { path: filePath, title, content, category };
  } catch {
    return null;
  }
}

export async function indexWorkspace(): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  for (const { dir, category } of SEARCH_PATHS) {
    const files = await findMarkdownFiles(dir);

    for (const filePath of files) {
      const fileInfo = await readFileContent(filePath);
      if (!fileInfo) {
        errors++;
        continue;
      }

      try {
        await db.searchIndex.upsert({
          where: { path: filePath },
          update: {
            title: fileInfo.title,
            content: fileInfo.content,
            category: fileInfo.category || category,
          },
          create: {
            path: filePath,
            title: fileInfo.title,
            content: fileInfo.content,
            category: fileInfo.category || category,
          },
        });
        indexed++;
      } catch (err) {
        console.error(`Failed to index ${filePath}:`, err);
        errors++;
      }
    }
  }

  return { indexed, errors };
}

interface SearchResult {
  id: string;
  path: string;
  title: string;
  category: string;
  snippet: string;
  score: number;
}

export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Simple search using LIKE for SQLite (FTS5 would be better but needs raw SQL)
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results = await db.searchIndex.findMany({
    where: {
      OR: searchTerms.map((term) => ({
        OR: [
          { title: { contains: term } },
          { content: { contains: term } },
        ],
      })),
    },
    take: limit,
  });

  // Score and create snippets
  return results.map((result) => {
    const lowerContent = result.content.toLowerCase();
    const lowerTitle = result.title.toLowerCase();

    // Calculate simple relevance score
    let score = 0;
    for (const term of searchTerms) {
      if (lowerTitle.includes(term)) score += 10;
      const contentMatches = (lowerContent.match(new RegExp(term, "gi")) || []).length;
      score += contentMatches;
    }

    // Create snippet around first match
    const firstTerm = searchTerms[0];
    const matchIndex = lowerContent.indexOf(firstTerm);
    let snippet = "";

    if (matchIndex >= 0) {
      const start = Math.max(0, matchIndex - 50);
      const end = Math.min(result.content.length, matchIndex + 150);
      snippet = result.content.slice(start, end);
      if (start > 0) snippet = "..." + snippet;
      if (end < result.content.length) snippet = snippet + "...";
    } else {
      snippet = result.content.slice(0, 150) + "...";
    }

    return {
      id: result.id,
      path: result.path,
      title: result.title,
      category: result.category,
      snippet: snippet.replace(/\n/g, " "),
      score,
    };
  }).sort((a, b) => b.score - a.score);
}
