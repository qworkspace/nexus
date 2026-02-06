import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search-index";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!query) {
    return NextResponse.json({ results: [], query: "" });
  }

  try {
    // Search indexed files
    let results = await search(query, limit);

    // Filter by category if specified
    if (category) {
      results = results.filter((r) => r.category === category);
    }

    // Also search activities
    const activityResults = await db.activity.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { timestamp: "desc" },
    });

    const activitySearchResults = activityResults.map((a) => ({
      id: a.id,
      path: `/activity#${a.id}`,
      title: a.title,
      category: "activity" as const,
      snippet: a.description || `${a.type} - ${a.action}`,
      score: 5,
    }));

    // Combine and sort
    const allResults = [...results];
    if (!category || category === "activity") {
      allResults.push(...activitySearchResults);
    }

    allResults.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      results: allResults.slice(0, limit),
      query,
      total: allResults.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    );
  }
}
