import { NextRequest, NextResponse } from "next/server";
import { parseTranscripts, exportToCSV, exportToJSON } from "@/lib/activity-parser";

// GET - List activities with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format"); // "csv" or "json" for export

  const options: Parameters<typeof parseTranscripts>[0] = {
    limit,
    offset,
  };

  if (type) options.type = type;
  if (status) options.status = status;
  if (search) options.search = search;
  if (from) options.from = new Date(from);
  if (to) options.to = new Date(to);

  const data = await parseTranscripts(options);

  // Serialize metadata to JSON strings for UI compatibility
  const serializedActivities = data.activities.map((a) => ({
    ...a,
    metadata: a.metadata ? JSON.stringify(a.metadata) : null,
  }));

  // Export to CSV or JSON if requested
  if (format === "csv") {
    const csv = exportToCSV(data.activities);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="activity-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  if (format === "json") {
    const json = exportToJSON(data.activities);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="activity-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  }

  return NextResponse.json({
    activities: serializedActivities,
    total: data.total,
    limit: options.limit,
    offset: options.offset,
    hasMore: data.hasMore,
  });
}

// POST - Not needed for transcript-based approach
// Activities are logged directly to transcripts
export async function POST() {
  return NextResponse.json(
    { error: "Activities are logged directly to transcripts" },
    { status: 501 }
  );
}
