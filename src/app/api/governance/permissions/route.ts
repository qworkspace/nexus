import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { agentId, tool, granted } = await request.json();

    if (!agentId || !tool || typeof granted !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request: agentId, tool, and granted are required" },
        { status: 400 }
      );
    }

    // For now, just return success. Production should update database.
    console.log(`Permission updated: ${agentId} -> ${tool} = ${granted}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permissions API error:", error);
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
  }
}
