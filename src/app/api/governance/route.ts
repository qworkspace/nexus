import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const days = parseInt(searchParams.get("days") || "7");

  try {
    // For now, return mock data. Production should query actual database.
    const now = new Date();

    const agents = [
      { id: "main", type: "main", totalRuns: 42, successRate: 0.95, avgDuration: 1200, costPerSuccess: 0.0234 },
      { id: "dev", type: "dev", totalRuns: 156, successRate: 0.88, avgDuration: 3400, costPerSuccess: 0.0456 },
      { id: "creative", type: "creative", totalRuns: 23, successRate: 0.91, avgDuration: 2100, costPerSuccess: 0.0387 },
    ];

    const permissions = {
      main: { exec: true, message: true, read: true, write: true, web_search: true, web_fetch: true },
      dev: { exec: true, message: true, read: true, write: true, web_search: false, web_fetch: true },
      creative: { exec: false, message: true, read: true, write: true, web_search: true, web_fetch: true },
    };

    const auditLogs = [
      {
        id: "1",
        timestamp: now.toISOString(),
        agentId: "main",
        tool: "message",
        action: "Send Telegram message",
        result: "success",
        durationMs: 234,
      },
      {
        id: "2",
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        agentId: "dev",
        tool: "exec",
        action: "Run build command",
        result: "error",
        durationMs: 5400,
      },
      {
        id: "3",
        timestamp: new Date(now.getTime() - 120000).toISOString(),
        agentId: "creative",
        tool: "web_search",
        action: "Search for design inspiration",
        result: "success",
        durationMs: 890,
      },
    ];

    const summary = {
      totalAgents: agents.length,
      totalRunsToday: 221,
      avgSuccessRate: 0.913,
      totalCostToday: 8.45,
    };

    return NextResponse.json({
      agents,
      permissions,
      auditLogs,
      summary,
    });
  } catch (error) {
    console.error("Governance API error:", error);
    return NextResponse.json(
      {
        agents: [],
        permissions: {},
        auditLogs: [],
        summary: {
          totalAgents: 0,
          totalRunsToday: 0,
          avgSuccessRate: 0,
          totalCostToday: 0,
        },
      },
      { status: 500 }
    );
  }
}
