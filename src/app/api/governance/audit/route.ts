import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _agentId = searchParams.get("agentId");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _limit = parseInt(searchParams.get("limit") || "100");

  try {
    // For now, return mock data. Production should query database.
    return NextResponse.json([]);
  } catch (error) {
    console.error("Audit log API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
