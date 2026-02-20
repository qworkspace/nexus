import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { db } from '@/lib/db';

const SPEC_BRIEFS_DIR = join(homedir(), '.openclaw', 'shared', 'research', 'ai-intel', 'spec-briefs');

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
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

type Source = 'research' | 'deep-focus' | 'innovation-think' | 'retro' | 'pj-request' | 'manual';

function mapSource(sourceStr: string): Source {
  const s = sourceStr.toLowerCase();
  if (s.includes('innovation')) return 'innovation-think';
  if (s.includes('deep-focus') || s.includes('deep focus')) return 'deep-focus';
  if (s.includes('intel') || s.includes('research') || s.includes('scan')) return 'research';
  if (s.includes('retro')) return 'retro';
  if (s.includes('pj') || s.includes('request')) return 'pj-request';
  return 'manual';
}

function safeDate(v: string | undefined): Date {
  if (!v) return new Date();
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

interface ParsedBrief {
  title: string;
  problem: string;
  solution: string;
  impact: string;
  description: string;
  source: Source;
  sourceRef: string;
  priority: string;
  complexity: string;
  createdAt: string;
  researchRef?: string;
  front?: string;
}

function parseMdBrief(content: string, filename: string): ParsedBrief {
  const titleMatch = content.match(/^#\s*(?:Spec Brief:\s*)?(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '');
  const problem = extractSection(content, ['Key Insight', 'What It Is', 'Problem', 'Background']) || 'See full brief for details.';
  const solution = extractSection(content, ['Proposed Build', 'Suggested Action', 'Solution', 'Implementation']) || 'See full brief for details.';
  const impact = extractSection(content, ['Impact', 'Why It Matters', 'Benefits']) || 'Improves system capabilities.';
  const priority = (extractField(content, 'Priority') || 'MED').toUpperCase();
  const complexity = (extractField(content, 'Complexity') || 'MED').toUpperCase();
  const sourceRaw = extractField(content, 'Source');
  const createdAt = extractField(content, 'Created') || filename.slice(0, 10);

  const researchRef = extractField(content, 'ResearchRef') || extractField(content, 'Research Ref') || undefined;
  const front = extractField(content, 'Front') || undefined;

  return {
    title, problem, solution, impact,
    description: `${problem}\n\n${solution}`.trim(),
    source: mapSource(sourceRaw),
    sourceRef: `spec-briefs/${filename}`,
    priority: ['HIGH', 'MED', 'LOW'].includes(priority) ? priority : 'MED',
    complexity: ['HIGH', 'MED', 'LOW'].includes(complexity) ? complexity : 'MED',
    createdAt: createdAt.includes('T') ? createdAt : `${createdAt}T00:00:00Z`,
    researchRef,
    front,
  };
}

function parseJsonBrief(data: Record<string, unknown>, filename: string): ParsedBrief {
  const title = (data.title as string) || filename.replace(/\.summary\.json$/, '');
  const problemSolved = data.problemSolved as string | undefined;
  const summary = data.summary as string | undefined;
  const keyPoints = (data.keyFindings || data.keyPoints) as string[] | undefined;
  const successMetric = data.successMetric as string | undefined;

  const problem = (problemSolved || summary || 'See full brief.').slice(0, 500);
  const solution = (problemSolved ? (summary || (keyPoints ? keyPoints.slice(0, 2).join('. ') : '')) : (keyPoints ? keyPoints.slice(0, 2).join('. ') : '') || 'See full brief.').slice(0, 500);
  const impact = (successMetric || (keyPoints ? keyPoints[keyPoints.length - 1] : '') || 'Improves system.').slice(0, 500);

  const priority = ((data.priority as string) || 'MED').toUpperCase();
  const complexity = ((data.complexity as string) || 'MED').toUpperCase();
  const sourceRaw = (data.source as string) || '';
  const dateRaw = (data.date as string) || filename.slice(0, 10);

  return {
    title, problem, solution, impact,
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
    if (!existsSync(SPEC_BRIEFS_DIR)) {
      return NextResponse.json({ ok: true, ingested: 0, message: 'No spec-briefs directory found' });
    }

    // Get existing brief IDs and slugs from DB
    const existing = await db.brief.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map(b => b.id));
    const existingSlugs = new Set(existing.map(b => {
      const parts = b.id.split('-').slice(4);
      return parts.join('-');
    }));

    const files = readdirSync(SPEC_BRIEFS_DIR);
    let ingested = 0;
    const newItems: string[] = [];

    for (const file of files) {
      const filePath = join(SPEC_BRIEFS_DIR, file);
      const isMd = file.endsWith('.md');
      const isJson = file.endsWith('.summary.json');
      if (!isMd && !isJson) continue;

      const fileSlug = slugify(
        file.replace(/\.summary\.json$/, '').replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
      );

      const alreadyExists = [...existingSlugs].some(s => {
        const norm = (str: string) => str.replace(/[^a-z0-9]/g, '');
        return norm(s).includes(norm(fileSlug)) || norm(fileSlug).includes(norm(s));
      });
      if (alreadyExists) continue;

      try {
        const raw = readFileSync(filePath, 'utf-8');
        let parsed: ParsedBrief;

        if (isMd) {
          parsed = parseMdBrief(raw, file);
        } else {
          parsed = parseJsonBrief(JSON.parse(raw), file);
        }

        const datePrefix = file.slice(0, 10);
        const titleSlug = slugify(parsed.title || file);
        const id = `brief-${datePrefix}-${titleSlug}`;

        if (existingIds.has(id)) continue;

        await db.brief.create({
          data: {
            id,
            title: parsed.title,
            problem: parsed.problem,
            solution: parsed.solution,
            impact: parsed.impact,
            description: parsed.description,
            source: parsed.source,
            sourceRef: parsed.sourceRef,
            status: 'pending-review',
            priority: parsed.priority,
            complexity: parsed.complexity,
            createdAt: safeDate(parsed.createdAt),
            ...(parsed.researchRef ? { researchRef: parsed.researchRef } : {}),
            ...(parsed.front ? { front: parsed.front } : {}),
          },
        });

        existingIds.add(id);
        existingSlugs.add(titleSlug);
        newItems.push(parsed.title);
        ingested++;
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }

    const total = await db.brief.count();
    return NextResponse.json({ ok: true, ingested, items: newItems, total });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
