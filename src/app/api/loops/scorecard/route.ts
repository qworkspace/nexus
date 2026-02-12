import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

interface ScorecardMetric {
  name: string;
  score: number;
  maxScore: number;
  reasoning?: string;
}

// ScorecardData interface for API response typing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ScorecardData {
  date: string;
  assessmentFile: string;
  overall: number;
  metrics: Array<{
    name: string;
    score: number;
    previousScore?: number;
    delta?: number;
  }>;
}

export async function GET() {
  try {
    const homeDir = process.env.HOME || '';
    const selfImprovementDir = path.join(
      homeDir,
      'shared',
      'research',
      'self-improvement'
    );

    // Read all assessment files
    let assessmentFiles: string[] = [];
    try {
      const files = await fs.readdir(selfImprovementDir);
      assessmentFiles = files
        .filter((f) => f.match(/^\d{4}-\d{2}-\d{2}-assessment\.md$/))
        .sort()
        .reverse();
    } catch {
      // Directory doesn't exist yet
      return NextResponse.json({
        current: null,
        previous: null,
      });
    }

    if (assessmentFiles.length === 0) {
      return NextResponse.json({
        current: null,
        previous: null,
      });
    }

    // Parse current and previous scorecards
    const currentFile = assessmentFiles[0];
    const previousFile = assessmentFiles[1];

    const [currentScorecard, previousScorecard] = await Promise.all([
      parseAssessmentFile(path.join(selfImprovementDir, currentFile)),
      previousFile ? parseAssessmentFile(path.join(selfImprovementDir, previousFile)) : null,
    ]);

    // Calculate deltas for each metric
    const metricsWithDeltas = currentScorecard.metrics.map((metric) => {
      const previous = previousScorecard?.metrics.find(m => m.name === metric.name);
      return {
        name: metric.name,
        score: metric.score,
        previousScore: previous?.score,
        delta: previous !== undefined ? metric.score - previous.score : undefined,
      };
    });

    return NextResponse.json({
      current: {
        date: currentScorecard.date,
        assessmentFile: currentFile,
        overall: currentScorecard.overall,
        metrics: metricsWithDeltas,
      },
      previous: previousScorecard ? {
        date: previousScorecard.date,
        assessmentFile: previousFile,
        overall: previousScorecard.overall,
        metrics: previousScorecard.metrics,
      } : null,
    });
  } catch (err) {
    console.error('Scorecard API error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function parseAssessmentFile(
  filePath: string
): Promise<{ date: string; overall: number; metrics: ScorecardMetric[] }> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Extract date from filename or header
  const filename = path.basename(filePath, '.md');
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

  // Find scorecard section (looks for "## Part 5: Scorecard" or similar)
  let scorecardStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('scorecard')) {
      scorecardStart = i;
      break;
    }
  }

  if (scorecardStart === -1) {
    // Try to find table with dimension/score columns
    scorecardStart = lines.findIndex((l) =>
      l.includes('Dimension') && l.includes('Score')
    );
  }

  const metrics: ScorecardMetric[] = [];
  let overall = 0;

  // Parse metrics from table
  if (scorecardStart !== -1) {
    for (let i = scorecardStart; i < Math.min(scorecardStart + 20, lines.length); i++) {
      const line = lines[i];

      // Look for table rows with scores
      const autonomyMatch = line.match(/\*\*Autonomy\*\*\s*\|\s*(\d+)\/10/);
      if (autonomyMatch) {
        metrics.push({ name: 'Autonomy', score: parseInt(autonomyMatch[1]), maxScore: 10 });
      }

      const qualityMatch = line.match(/\*\*Quality\*\*\s*\|\s*(\d+)\/10/);
      if (qualityMatch) {
        metrics.push({ name: 'Quality', score: parseInt(qualityMatch[1]), maxScore: 10 });
      }

      const speedMatch = line.match(/\*\*Speed\*\*\s*\|\s*(\d+)\/10/);
      if (speedMatch) {
        metrics.push({ name: 'Speed', score: parseInt(speedMatch[1]), maxScore: 10 });
      }

      const alignmentMatch = line.match(/\*\*Alignment\*\*\s*\|\s*(\d+)\/10/);
      if (alignmentMatch) {
        metrics.push({ name: 'Alignment', score: parseInt(alignmentMatch[1]), maxScore: 10 });
      }

      const energyMatch = line.match(/\*\*Energy\*\*\s*\|\s*(\d+)\/10/);
      if (energyMatch) {
        metrics.push({ name: 'Energy', score: parseInt(energyMatch[1]), maxScore: 10 });
      }

      // Extract overall score
      const overallMatch = line.match(/\*\*Overall:\s*(\d+\.?\d*)\/10/);
      if (overallMatch) {
        overall = parseFloat(overallMatch[1]);
      }
    }
  }

  // If no metrics found from table, try parsing text format
  if (metrics.length === 0) {
    for (const line of lines) {
      if (line.match(/Autonomy:\s*(\d+)\/10/)) {
        metrics.push({ name: 'Autonomy', score: parseInt(line.match(/(\d+)\/10/)![1]), maxScore: 10 });
      }
      if (line.match(/Quality:\s*(\d+)\/10/)) {
        metrics.push({ name: 'Quality', score: parseInt(line.match(/(\d+)\/10/)![1]), maxScore: 10 });
      }
      if (line.match(/Speed:\s*(\d+)\/10/)) {
        metrics.push({ name: 'Speed', score: parseInt(line.match(/(\d+)\/10/)![1]), maxScore: 10 });
      }
      if (line.match(/Alignment:\s*(\d+)\/10/)) {
        metrics.push({ name: 'Alignment', score: parseInt(line.match(/(\d+)\/10/)![1]), maxScore: 10 });
      }
      if (line.match(/Energy:\s*(\d+)\/10/)) {
        metrics.push({ name: 'Energy', score: parseInt(line.match(/(\d+)\/10/)![1]), maxScore: 10 });
      }
    }
  }

  return { date, overall, metrics };
}
