import { NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const REL_DIR = join(process.env.HOME || '', 'shared/relationships');

export async function GET() {
  try {
    const files = readdirSync(REL_DIR).filter(f => f.endsWith('.json') && f !== 'graph.json');
    const relationships: Record<string, unknown> = {};

    for (const f of files) {
      const data = JSON.parse(readFileSync(join(REL_DIR, f), 'utf-8'));
      const agentId = f.replace('.json', '');
      relationships[agentId] = data;
    }

    return NextResponse.json({ relationships });
  } catch (error) {
    return NextResponse.json(
      { relationships: {}, error: String(error) },
      { status: 500 }
    );
  }
}
