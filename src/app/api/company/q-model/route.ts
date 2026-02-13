import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const OPENCLAW_CONFIG_PATH = join(process.env.HOME || '', '.openclaw', 'openclaw.json');

export async function GET() {
  try {
    const config = JSON.parse(readFileSync(OPENCLAW_CONFIG_PATH, 'utf-8'));
    const primaryModel = config.agents.defaults.model?.primary;

    if (!primaryModel) {
      throw new Error('No primary model found in OpenClaw config');
    }

    // Format for display
    const modelDisplay = primaryModel
      .replace('anthropic/', '')
      .replace('claude-opus-4-6', 'Claude Opus 4.6')
      .replace('claude-opus-4-5', 'Claude Opus 4.5')
      .replace('claude-sonnet-4-5', 'Claude Sonnet 4.5');

    return NextResponse.json({
      model: primaryModel,
      modelDisplay,
    });
  } catch (error) {
    console.error('Error fetching Q model:', error);
    // Fallback to Claude Opus 4.6 if we can't read config
    return NextResponse.json(
      {
        model: 'anthropic/claude-opus-4-6',
        modelDisplay: 'Claude Opus 4.6',
      },
      { status: 200 }
    );
  }
}
