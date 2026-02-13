import { NextResponse } from "next/server";

export async function GET() {
  try {
    // For now, return mock stats. Production should aggregate from database.
    return NextResponse.json({
      totalRuns: 0,
      successRate: 0,
      avgDuration: 0,
      costPerSuccess: 0,
      totalCost: 0,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        totalRuns: 0,
        successRate: 0,
        avgDuration: 0,
        costPerSuccess: 0,
        totalCost: 0,
      },
      { status: 500 }
    );
  }
}
