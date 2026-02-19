import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import { CompletedBuild } from '@/types/builds';

interface GitCommit {
  hash: string;
  message: string;
  timestamp: string;
  author: string;
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const projectDir = path.join(process.env.HOME || '', 'projects/mission-control');

    // Get commits with feat/fix prefix (build commits)
    const gitLog = execSync(
      `git log --format='%H|%s|%ai|%an' --since='30 days ago'`,
      { cwd: projectDir, encoding: 'utf-8' }
    );

    const buildCommits: GitCommit[] = gitLog
      .trim().split('\n')
      .filter(line => line.includes('feat:') || line.includes('fix:'))
      .map(line => {
        const [hash, message, timestamp, author] = line.split('|');
        return { hash, message, timestamp, author };
      });

    // Get diff stats for each commit
    const commitsWithStats: CompletedBuild[] = buildCommits.slice(0, limit).map(commit => {
      try {
        const diffStat = execSync(
          `git diff --shortstat ${commit.hash}^..${commit.hash}`,
          { cwd: projectDir, encoding: 'utf-8' }
        );

        const match = diffStat.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
        const filesChanged = match ? parseInt(match[1]) : 0;
        const linesAdded = match && match[2] ? parseInt(match[2]) : 0;
        const linesRemoved = match && match[3] ? parseInt(match[3]) : 0;

        return {
          hash: commit.hash.substring(0, 8),
          message: commit.message,
          author: commit.author,
          timestamp: commit.timestamp,
          filesChanged,
          linesAdded,
          linesRemoved,
        };
      } catch {
        return {
          hash: commit.hash.substring(0, 8),
          message: commit.message,
          author: commit.author,
          timestamp: commit.timestamp,
          filesChanged: 0,
          linesAdded: 0,
          linesRemoved: 0,
        };
      }
    });

    return NextResponse.json(commitsWithStats);
  } catch (error) {
    console.error('Error fetching builds:', error);
    return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 });
  }
}
