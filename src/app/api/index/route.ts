import { NextResponse } from "next/server";
import { indexWorkspace } from "@/lib/search-index";

export async function POST() {
  try {
    const result = await indexWorkspace();
    return NextResponse.json({
      success: true,
      indexed: result.indexed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Indexing error:", error);
    return NextResponse.json(
      { success: false, error: "Indexing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger reindexing",
  });
}
