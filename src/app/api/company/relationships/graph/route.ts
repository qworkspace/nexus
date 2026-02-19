import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const GRAPH_PATH = join(process.env.HOME || '', '.openclaw/shared/relationships/graph.json');
const REL_DIR = join(process.env.HOME || '', '.openclaw/shared/relationships');
const ROSTER_PATH = join(process.env.HOME || '', '.openclaw/shared/agent-roster.json');

function computeGraph() {
  const roster = JSON.parse(readFileSync(ROSTER_PATH, 'utf-8'));
  const agents: Record<string, { id: string; name: string; emoji: string; role: string; department: string }> = {};
  for (const a of roster.agents || []) {
    agents[a.id] = a;
  }

  const nodes = Object.values(agents).map(a => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    role: a.role,
    department: a.department || '',
  }));

  const edges: { source: string; target: string; trustA: number; trustB: number; avgTrust: number }[] = [];
  const agentIds = Object.keys(agents).sort();

  for (let i = 0; i < agentIds.length; i++) {
    for (let j = i + 1; j < agentIds.length; j++) {
      const a = agentIds[i];
      const b = agentIds[j];

      let trustA = 50;
      let trustB = 50;

      try {
        const relA = JSON.parse(readFileSync(join(REL_DIR, `${a}.json`), 'utf-8'));
        trustA = relA.relationships?.[b]?.trust ?? 50;
      } catch { /* default */ }

      try {
        const relB = JSON.parse(readFileSync(join(REL_DIR, `${b}.json`), 'utf-8'));
        trustB = relB.relationships?.[a]?.trust ?? 50;
      } catch { /* default */ }

      edges.push({
        source: a,
        target: b,
        trustA,
        trustB,
        avgTrust: (trustA + trustB) / 2,
      });
    }
  }

  return { nodes, edges };
}

export async function GET() {
  try {
    let graph;
    if (existsSync(GRAPH_PATH)) {
      graph = JSON.parse(readFileSync(GRAPH_PATH, 'utf-8'));
    } else {
      graph = computeGraph();
    }
    return NextResponse.json(graph);
  } catch (error) {
    return NextResponse.json(
      { nodes: [], edges: [], error: String(error) },
      { status: 500 }
    );
  }
}
