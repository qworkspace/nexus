import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const homeDir = process.env.HOME || '';
    
    // Read latest scorecard
    const selfImprovementDir = path.join(
      homeDir,
      '.openclaw',
      'shared',
      'research',
      'self-improvement'
    );

    let scorecard = null;
    let regressions: Array<{ severity: string; pattern: string; count: number }> = [];

    try {
      const files = await fs.readdir(selfImprovementDir);
      
      // Get latest scorecard
      const scorecardFiles = files
        .filter((f) => f.startsWith('weekly-scorecard-'))
        .sort()
        .reverse();

      if (scorecardFiles.length > 0) {
        const content = await fs.readFile(
          path.join(selfImprovementDir, scorecardFiles[0]),
          'utf-8'
        );
        scorecard = parseScorecard(content);
      }

      // Get latest regression report
      const regressionFiles = files
        .filter((f) => f.includes('-regressions.md'))
        .sort()
        .reverse();

      if (regressionFiles.length > 0) {
        const content = await fs.readFile(
          path.join(selfImprovementDir, regressionFiles[0]),
          'utf-8'
        );
        regressions = parseRegressions(content);
      }
    } catch {
      // self-improvement dir doesn't exist yet
    }

    // Read skills
    const skillsFile = path.join(
      homeDir,
      '.openclaw',
      'workspace',
      'tools',
      'loop0',
      'skills.json'
    );

    let skills: {
      total: number;
      proficiency_avg: number;
      by_category: Record<string, number>;
      recent: Array<{ name: string; acquired: string; proficiency: number }>;
    } = { total: 0, proficiency_avg: 0, by_category: {}, recent: [] };

    try {
      const skillsData = JSON.parse(await fs.readFile(skillsFile, 'utf-8'));
      const skillsList = skillsData.skills || [];
      
      skills = {
        total: skillsList.length,
        proficiency_avg: skillsList.length > 0
          ? skillsList.reduce((sum: number, s: { proficiency: number }) => sum + s.proficiency, 0) / skillsList.length
          : 0,
        by_category: skillsList.reduce((acc: Record<string, number>, s: { category: string }) => {
          acc[s.category] = (acc[s.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent: skillsList
          .sort((a: { acquired: string }, b: { acquired: string }) => b.acquired.localeCompare(a.acquired))
          .slice(0, 5)
          .map((s: { name: string; acquired: string; proficiency: number }) => ({
            name: s.name,
            acquired: s.acquired,
            proficiency: s.proficiency
          }))
      };
    } catch {
      // skills.json doesn't exist yet
    }

    // Read build success rate from overnight-builds.log
    const buildStats = { success: 0, failed: 0, total: 0, rate: 0 };
    try {
      const buildsLog = path.join(homeDir, '.openclaw', 'shared', 'overnight-builds.log');
      const logContent = await fs.readFile(buildsLog, 'utf-8');
      const lines = logContent.split('\n').filter(l => l.includes('BUILD:'));
      const last20 = lines.slice(-20);
      
      buildStats.success = last20.filter(l => l.includes('SUCCESS')).length;
      buildStats.failed = last20.filter(l => l.includes('FAILED')).length;
      buildStats.total = last20.length;
      buildStats.rate = buildStats.total > 0 
        ? Math.round((buildStats.success / buildStats.total) * 100) 
        : 0;
    } catch {
      // builds log doesn't exist
    }

    // Count lessons learned this week
    let lessonsThisWeek = 0;
    try {
      const lessonsFile = path.join(homeDir, '.openclaw', 'workspace', 'LESSONS.md');
      const lessonsContent = await fs.readFile(lessonsFile, 'utf-8');
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Count "Added: YYYY-MM-DD" entries from this week
      const addedMatches = lessonsContent.match(/Added:\s*(\d{4}-\d{2}-\d{2})/g) || [];
      lessonsThisWeek = addedMatches.filter(m => {
        const date = m.replace('Added:', '').trim();
        return date >= weekAgo.toISOString().slice(0, 10);
      }).length;
    } catch {
      // lessons file doesn't exist
    }

    return NextResponse.json({
      scorecard,
      regressions,
      skills,
      buildStats,
      lessonsThisWeek,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Loop status error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function parseScorecard(content: string): Record<string, number> {
  const lines = content.split('\n');
  const metrics: Record<string, number> = {};

  for (const line of lines) {
    if (line.includes('Autonomy:')) metrics.autonomy = extractScore(line);
    if (line.includes('Quality:')) metrics.quality = extractScore(line);
    if (line.includes('Speed:')) metrics.speed = extractScore(line);
    if (line.includes('Alignment:')) metrics.alignment = extractScore(line);
    if (line.includes('Energy:')) metrics.energy = extractScore(line);
    if (line.includes('Learning Velocity:'))
      metrics.learning_velocity = extractNumber(line);
    if (line.includes('Regression Rate:'))
      metrics.regression_rate = extractNumber(line);
    if (line.includes('Skill Coverage:'))
      metrics.skill_coverage = extractNumber(line);
    if (line.includes('Build Success Rate:'))
      metrics.build_success_rate = extractNumber(line);
  }

  return metrics;
}

function extractScore(line: string): number {
  const match = line.match(/(\d+)\/10/);
  return match ? parseInt(match[1]) : 0;
}

function extractNumber(line: string): number {
  const match = line.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseRegressions(content: string): Array<{ severity: string; pattern: string; count: number }> {
  const regressions: Array<{ severity: string; pattern: string; count: number }> = [];
  const blocks = content.split('##').slice(1); // Skip header

  for (const block of blocks) {
    const lines = block.split('\n');
    if (!lines[0]) continue;
    
    const firstLine = lines[0];
    const severity = firstLine.includes('HIGH') ? 'high' : 'medium';
    const pattern = firstLine
      .replace(/🔴|🟡/g, '')
      .replace('HIGH', '')
      .replace('MEDIUM', '')
      .replace('—', '')
      .trim();
    
    const violationsMatch = block.match(/Violations:\*?\*?\s*(\d+)/);
    const count = violationsMatch ? parseInt(violationsMatch[1]) : 0;

    if (pattern && count > 0) {
      regressions.push({ severity, pattern, count });
    }
  }

  return regressions;
}
