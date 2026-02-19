import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { PipelineStage } from '@/types/builds';

const HANDOFFS_DIR = path.join(homedir(), '.openclaw', 'shared', 'pipeline', 'handoffs');

export async function GET() {
  try {
    const handoffFiles = await readdir(HANDOFFS_DIR);
    const pipelineStages: PipelineStage[] = [
      { name: 'Queued', agent: 'cipher', items: [] },
      { name: 'Speccing', agent: 'cipher', items: [] },
      { name: 'Building', agent: 'spark', items: [] },
      { name: 'QA', agent: 'flux', items: [] },
      { name: 'Shipped', agent: 'flux', items: [] },
      { name: 'Failed', agent: 'flux', items: [] },
    ];

    for (const file of handoffFiles) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = await readFile(path.join(HANDOFFS_DIR, file), 'utf-8');
        const handoff = JSON.parse(content);

        const item = {
          id: handoff.id || file.replace('.json', ''),
          name: handoff.task?.title || handoff.spec_path?.split('/').pop() || 'Unknown',
          status: handoff.status || 'queued',
          priority: (handoff.priority === 'high' ? 'P0' : handoff.priority === 'medium' ? 'P1' : 'P2') as 'P0' | 'P1' | 'P2',
          createdAt: handoff.created_at,
          estimatedDuration: handoff.task?.estimated_hours ? `${handoff.task.estimated_hours}h` : undefined,
        };

        // Map status to pipeline stage
        const stageMap: Record<string, number> = {
          'queued': 0,
          'pending': 0,
          'speccing': 1,
          'building': 2,
          'qa': 3,
          'shipped': 4,
          'complete': 4,
          'failed': 5,
        };

        const stageIndex = stageMap[item.status] ?? 0;
        pipelineStages[stageIndex].items.push(item);
      } catch {
        console.warn('Failed to parse handoff:', file);
      }
    }

    return NextResponse.json(pipelineStages);
  } catch (error) {
    console.error('Error fetching pipeline state:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}
