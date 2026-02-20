import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const briefs = await db.brief.findMany({ select: { status: true, priority: true, complexity: true } });

    const count = (status: string) => briefs.filter(b => b.status === status).length;

    const complexityBreakdown = { LOW: 0, MED: 0, HIGH: 0 };
    const priorityBreakdown = { LOW: 0, MED: 0, HIGH: 0 };
    briefs.forEach(b => {
      if (b.complexity && b.complexity in complexityBreakdown) complexityBreakdown[b.complexity as keyof typeof complexityBreakdown]++;
      if (b.priority in priorityBreakdown) priorityBreakdown[b.priority as keyof typeof priorityBreakdown]++;
    });

    const shipped = briefs.filter(b => b.status === 'shipped');

    return NextResponse.json({
      total: briefs.length,
      new: count("new"),
      approved: count("approved"),
      parked: count("parked"),
      rejected: count("rejected"),
      specced: count("speccing"),
      building: count("building"),
      shipped: count("shipped"),
      review: count("review"),
      queued: count("queued"),
      approvalRate: briefs.length > 0 ? Math.round((shipped.length / briefs.length) * 100) : 0,
      avgTimeToShip: shipped.length > 0 ? `${shipped.length} shipped` : "N/A",
      complexityBreakdown,
      priorityBreakdown,
    });
  } catch {
    return NextResponse.json({ total: 0, new: 0, approved: 0, parked: 0, rejected: 0, specced: 0, building: 0, shipped: 0, review: 0, queued: 0, approvalRate: 0, avgTimeToShip: "N/A", complexityBreakdown: { LOW: 0, MED: 0, HIGH: 0 }, priorityBreakdown: { LOW: 0, MED: 0, HIGH: 0 } });
  }
}
