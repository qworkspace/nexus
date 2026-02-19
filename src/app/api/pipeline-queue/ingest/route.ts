import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const QUEUE_PATH = join(homedir(), '.openclaw', 'shared', 'pipeline-queue.json');
const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');

interface PipelineItem {
  id: string;
  title: string;
  problem: string;
  solution: string;
  impact: string;
  description: string;
  source: 'research' | 'deep-focus' | 'innovation-think' | 'retro' | 'pj-request' | 'manual';
  sourceRef: string | null;
  status: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  complexity: 'HIGH' | 'MED' | 'LOW';
  createdAt: string;
  approvedAt: string;
  assignee: string;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function extractSection(content: string, headings: string[]): string {
  for (const heading of headings) {
    const regex = new RegExp(`##\\s*${heading}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
    const match = content.match(regex);
    if (match && match[1].trim()) {
      return match[1].trim().split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean).join(' ').slice(0, 500);
    }
  }
  return '';
}

function extractField(content: string, field: string): string {
  const regex = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function mapSource(sourceStr: string): PipelineItem['source'] {
  const s = sourceStr.toLowerCase();
  if (s.includes('innovation')) return 'innovation-think';
  if (s.includes('deep-focus') || s.includes('deep focus')) return 'deep-focus';
  if (s.includes('intel') || s.includes('research') || s.includes('scan')) return 'research';
  if (s.includes('retro')) return 'retro';
  if (s.includes('pj') || s.includes('request') || s.includes('pj-review') || s.includes('pj-request')) return 'pj-request';
  return 'manual';
}

function parseMdBrief(content: string, filename: string): Partial<PipelineItem> {
  // Title
  const titleMatch = content.match(/^#\s*(?:Spec Brief:\s*)?(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '');

  const problem = extractSection(content, ['Key Insight', 'What It Is', 'Problem', 'Background']);
  const solution = extractSection(content, ['Proposed Build', 'Suggested Action', 'Solution', 'Implementation']);
  const impact = extractSection(content, ['Impact', 'Why It Matters', 'Benefits']);
  const priority = (extractField(content, 'Priority') || 'MED').toUpperCase() as 'HIGH' | 'MED' | 'LOW';
  const complexity = (extractField(content, 'Complexity') || 'MED').toUpperCase() as 'HIGH' | 'MED' | 'LOW';
  const sourceRaw = extractField(content, 'Source');
  const createdAt = extractField(content, 'Created') || filename.slice(0, 10);

  return {
    title,
    problem: problem || 'See full brief for details.',
    solution: solution || 'See full brief for details.',
    impact: impact || 'Improves system capabilities.',
    description: `${problem}\n\n${solution}`.trim(),
    source: mapSource(sourceRaw),
    sourceRef: `spec-briefs/${filename}`,
    priority: ['HIGH', 'MED', 'LOW'].includes(priority) ? priority : 'MED',
    complexity: ['HIGH', 'MED', 'LOW'].includes(complexity) ? complexity : 'MED',
    createdAt: createdAt.includes('T') ? createdAt : `${createdAt}T00:00:00Z`,
  };
}

function parseJsonBrief(data: Record<string, unknown>, filename: string): Partial<PipelineItem> {
  const title = (data.title as string) || filename.replace(/\.summary\.json$/, '');
  const problemSolved = data.problemSolved as string | undefined;
  const summary = data.summary as string | undefined;
  const keyPoints = (data.keyFindings || data.keyPoints) as string[] | undefined;
  const successMetric = data.successMetric as string | undefined;

  const problem = problemSolved || summary || 'See full brief.';
  const solution = problemSolved ? (summary || (keyPoints ? keyPoints.slice(0, 2).join('. ') : '')) : (keyPoints ? keyPoints.slice(0, 2).join('. ') : '');
  const impact = successMetric || (keyPoints ? keyPoints[keyPoints.length - 1] : '') || 'Improves system.';

  const priority = ((data.priority as string) || 'MED').toUpperCase() as 'HIGH' | 'MED' | 'LOW';
  const complexity = ((data.complexity as string) || 'MED').toUpperCase() as 'HIGH' | 'MED' | 'LOW';
  const sourceRaw = (data.source as string) || '';
  const dateRaw = (data.date as string) || filename.slice(0, 10);

  return {
    title,
    problem: problem.slice(0, 500),
    solution: (solution || 'See full brief.').slice(0, 500),
    impact: (impact || '').slice(0, 500),
    description: `${problem}\n\n${solution}`.trim(),
    source: mapSource(sourceRaw),
    sourceRef: `spec-briefs/${filename}`,
    priority: ['HIGH', 'MED', 'LOW'].includes(priority) ? priority : 'MED',
    complexity: ['HIGH', 'MED', 'LOW'].includes(complexity) ? complexity : 'MED',
    createdAt: dateRaw.includes('T') ? dateRaw : `${dateRaw}T00:00:00Z`,
  };
}

export async function POST() {
  try {
    // Load or create queue
    let queueData: { briefs: PipelineItem[]; updated?: string } = { briefs: [] };
    if (existsSync(QUEUE_PATH)) {
      queueData = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
      if (!Array.isArray(queueData.briefs)) queueData.briefs = [];
    }

    const existingIds = new Set(queueData.briefs.map(b => b.id));
    const existingSlugs = new Set(queueData.briefs.map(b => {
      const parts = b.id.split('-').slice(4); // after brief-YYYY-MM-DD-
      return parts.join('-');
    }));

    if (!existsSync(SPEC_BRIEFS_DIR)) {
      return NextResponse.json({ ok: true, ingested: 0, message: 'No spec-briefs directory found' });
    }

    const files = readdirSync(SPEC_BRIEFS_DIR);
    let ingested = 0;
    const newItems: string[] = [];

    for (const file of files) {
      const filePath = join(SPEC_BRIEFS_DIR, file);
      const isMd = file.endsWith('.md');
      const isJson = file.endsWith('.summary.json');
      if (!isMd && !isJson) continue;

      // Deduplicate by slug
      const fileSlug = slugify(
        file.replace(/\.summary\.json$/, '').replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
      );
      
      // Check if already exists by slug match
      const alreadyExists = [...existingSlugs].some(s => {
        const norm = (str: string) => str.replace(/[^a-z0-9]/g, '');
        return norm(s).includes(norm(fileSlug)) || norm(fileSlug).includes(norm(s));
      });
      if (alreadyExists) continue;

      try {
        const raw = readFileSync(filePath, 'utf-8');
        let parsed: Partial<PipelineItem>;

        if (isMd) {
          parsed = parseMdBrief(raw, file);
        } else {
          const jsonData = JSON.parse(raw);
          parsed = parseJsonBrief(jsonData, file);
        }

        const datePrefix = file.slice(0, 10);
        const titleSlug = slugify(parsed.title || file);
        const id = `brief-${datePrefix}-${titleSlug}`;

        if (existingIds.has(id)) continue;

        const item: PipelineItem = {
          id,
          title: parsed.title || file,
          problem: parsed.problem || '',
          solution: parsed.solution || '',
          impact: parsed.impact || '',
          description: parsed.description || '',
          source: parsed.source || 'research',
          sourceRef: parsed.sourceRef || null,
          status: 'pending-review',
          priority: parsed.priority || 'MED',
          complexity: parsed.complexity || 'MED',
          createdAt: parsed.createdAt || new Date().toISOString(),
          approvedAt: '',
          assignee: '',
        };

        queueData.briefs.push(item);
        existingIds.add(id);
        existingSlugs.add(titleSlug);
        newItems.push(item.title);
        ingested++;
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }

    queueData.updated = new Date().toISOString();
    
    // Ensure directory exists
    const queueDir = join(homedir(), '.openclaw', 'shared');
    if (!existsSync(queueDir)) mkdirSync(queueDir, { recursive: true });
    
    writeFileSync(QUEUE_PATH, JSON.stringify(queueData, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, ingested, items: newItems, total: queueData.briefs.length });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
