import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - List activities with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};

  if (type) where.type = type;
  if (status) where.status = status;
  if (from || to) {
    where.timestamp = {};
    if (from) (where.timestamp as Record<string, Date>).gte = new Date(from);
    if (to) (where.timestamp as Record<string, Date>).lte = new Date(to);
  }

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    }),
    db.activity.count({ where }),
  ]);

  return NextResponse.json({
    activities,
    total,
    limit,
    offset,
    hasMore: offset + activities.length < total,
  });
}

// POST - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { 
      type, 
      action, 
      title, 
      description, 
      metadata, 
      duration, 
      status,
      // Cost tracking fields
      tokensIn,
      tokensOut,
      tokensCacheRead,
      tokensCacheWrite,
      cost,
      model,
    } = body;

    if (!type || !action || !title) {
      return NextResponse.json(
        { error: "Missing required fields: type, action, title" },
        { status: 400 }
      );
    }

    const activity = await db.activity.create({
      data: {
        type,
        action,
        title,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        duration,
        status: status || "success",
        // Cost tracking
        tokensIn,
        tokensOut,
        tokensCacheRead,
        tokensCacheWrite,
        cost,
        model,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
