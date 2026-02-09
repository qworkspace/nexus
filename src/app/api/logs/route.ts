import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface ParsedLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  raw: string;
}

// Parse a single log line
function parseLogLine(line: string, index: number): ParsedLogEntry | null {
  if (!line.trim()) return null;

  // Try to match standard log format: TIMESTAMP [SOURCE] MESSAGE
  const standardMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+\[([^\]]+)\]\s+(.*)$/);
  if (standardMatch) {
    const [, timestamp, source, message] = standardMatch;
    const level = inferLogLevel(source, message);
    return {
      id: `${timestamp}-${index}`,
      timestamp,
      level,
      source,
      message,
      raw: line,
    };
  }

  // Try to match timestamp-only format: TIMESTAMP MESSAGE (without source)
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(.*)$/);
  if (timestampMatch) {
    const [, timestamp, message] = timestampMatch;
    const level = inferLogLevel('system', message);
    return {
      id: `${timestamp}-${index}`,
      timestamp,
      level,
      source: 'system',
      message,
      raw: line,
    };
  }

  // Fallback: try to extract timestamp from anywhere in the line
  const anywhereTimestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
  if (anywhereTimestampMatch) {
    const timestamp = anywhereTimestampMatch[1];
    const message = line.replace(timestamp, '').trim();
    const level = inferLogLevel('system', message || line);
    return {
      id: `${timestamp}-${index}`,
      timestamp,
      level,
      source: 'system',
      message: message || line,
      raw: line,
    };
  }

  // Final fallback: treat entire line as message with current timestamp
  return {
    id: `fallback-${index}`,
    timestamp: new Date().toISOString(),
    level: inferLogLevel('unknown', line),
    source: 'unknown',
    message: line,
    raw: line,
  };
}

// Infer log level based on source and message content
function inferLogLevel(source: string, message: string): 'info' | 'warn' | 'error' | 'debug' {
  const lowerMessage = message.toLowerCase();
  const lowerSource = source.toLowerCase();

  // Check for explicit error indicators
  if (
    lowerSource.includes('error') ||
    lowerMessage.includes('error') ||
    lowerMessage.includes('failed') ||
    lowerMessage.includes('exception') ||
    lowerMessage.includes('✗') ||
    lowerMessage.includes('code 1') ||
    lowerMessage.includes('code 127') ||
    lowerMessage.includes('code 130') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('aborterror')
  ) {
    return 'error';
  }

  // Check for warning indicators
  if (
    lowerSource.includes('warn') ||
    lowerMessage.includes('warn') ||
    lowerMessage.includes('conflict') ||
    lowerMessage.includes('deprecated') ||
    lowerMessage.includes('retrying')
  ) {
    return 'warn';
  }

  // Check for debug indicators
  if (
    lowerSource.includes('debug') ||
    lowerMessage.includes('debug') ||
    lowerMessage.includes('verbose') ||
    lowerMessage.includes('trace')
  ) {
    return 'debug';
  }

  // Default to info
  return 'info';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500');

    const logPath = join(process.env.HOME || '', '.openclaw', 'logs', 'gateway.log');

    // Check if log file exists
    if (!existsSync(logPath)) {
      return NextResponse.json({
        source: 'error',
        error: 'Log file not found',
        suggestion: `Ensure the gateway is running and logs are being written to: ${logPath}`,
        logs: [],
        count: 0,
      }, { status: 404 });
    }

    // Read log file
    const logContent = readFileSync(logPath, 'utf-8');
    const lines = logContent.split('\n').filter(line => line.trim());

    // Get the most recent entries
    const recentLines = lines.slice(-limit);

    // Parse each line
    const logs = recentLines
      .map((line, index) => parseLogLine(line, index))
      .filter((log): log is ParsedLogEntry => log !== null)
      .reverse(); // Reverse to show newest first

    return NextResponse.json({
      source: 'live',
      logs,
      count: logs.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Failed to fetch logs:', error);

    return NextResponse.json(
      {
        source: 'error',
        error: err?.message || 'Failed to fetch logs',
        logs: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
