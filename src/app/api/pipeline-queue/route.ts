import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';
import { briefToJson } from '@/lib/brief-utils';

export const dynamic = 'force-dynamic';

const ACTION_ITEMS_PATH = join(homedir(), '.openclaw', 'shared', 'action-items', 'index.json');

export async function GET() {
  try {
    const briefs = await db.brief.findMany({
      orderBy: [
        { priority: 'asc' }, // HIGH sorts before LOW alphabetically — invert if needed
        { createdAt: 'desc' },
      ],
    });

    // Sort: HIGH > MED > LOW, then by date desc
    const order = { HIGH: 0, MED: 1, LOW: 2 };
    briefs.sort((a, b) => {
      const pa = order[a.priority as keyof typeof order] ?? 3;
      const pb = order[b.priority as keyof typeof order] ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    let actionItems: object[] = [];
    try {
      if (existsSync(ACTION_ITEMS_PATH)) {
        const aiData = JSON.parse(readFileSync(ACTION_ITEMS_PATH, 'utf-8'));
        actionItems = (aiData.items || []).filter(
          (item: { status: string; assignee: string }) =>
            item.status === 'todo' && item.assignee === 'PJ'
        );
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({
      briefs: briefs.map(briefToJson),
      updated: new Date().toISOString(),
      actionItems,
    });
  } catch (error) {
    console.error('pipeline-queue GET error:', error);
    return NextResponse.json({ briefs: [], updated: null, actionItems: [], error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending-review', 'queued', 'speccing', 'building', 'qa', 'shipped', 'rejected', 'deferred', 'parked', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const existing = await db.brief.findUnique({ where: { id } });

    if (!existing) {
      // New brief creation — body contains full brief data
      if (body.title) {
        const { id: bid, title, description, problem, solution, impact, source, sourceRef,
          priority, complexity, front, tldr, skipCost, briefPath, assignee, buildCommit,
          createdAt, approvedAt, submittedBy, ...rest } = body;
        // Explicitly exclude status from metadata to prevent override
        delete rest.status;
        const created = await db.brief.create({
          data: {
            id: bid,
            title,
            description: description || null,
            problem: problem || null,
            solution: solution || null,
            impact: impact || null,
            source: source || null,
            sourceRef: sourceRef || null,
            status,
            priority: priority || 'MED',
            complexity: complexity || null,
            front: front || null,
            tldr: tldr || null,
            skipCost: skipCost || null,
            briefPath: briefPath || null,
            assignee: assignee || null,
            buildCommit: buildCommit || null,
            submittedBy: submittedBy || "Q",
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            approvedAt: approvedAt ? new Date(approvedAt) : null,
            metadata: Object.keys(rest).length ? JSON.stringify(rest) : null,
          },
        });
        return NextResponse.json({ ok: true, created: true, brief: briefToJson(created) });
      }
      return NextResponse.json({ error: `Brief ${id} not found` }, { status: 404 });
    }

    const updated = await db.brief.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true, brief: briefToJson(updated) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
