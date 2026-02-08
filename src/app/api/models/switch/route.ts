import { NextResponse } from 'next/server';

interface SwitchModelRequest {
  model: string;
}

interface SwitchModelResponse {
  success: boolean;
  message: string;
  previousModel?: string;
  newModel?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<SwitchModelResponse>> {
  try {
    const body = await request.json() as SwitchModelRequest;
    const { model } = body;

    if (!model) {
      return NextResponse.json({
        success: false,
        message: 'Model is required',
        error: 'Missing model parameter',
      }, { status: 400 });
    }

    // Validate model name
    const validModels = [
      'claude-opus-4-5',
      'claude-sonnet-4',
      'claude-3-5-sonnet',
      'claude-3-5-haiku',
      'glm-4-flash',
      'glm-4.7',
      'gpt-4o',
      'gpt-4o-mini',
    ];

    if (!validModels.includes(model)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid model',
        error: `Model must be one of: ${validModels.join(', ')}`,
      }, { status: 400 });
    }

    // In a real implementation, this would call OpenClaw to switch the model
    // For now, we'll just return a success response
    // TODO: Integrate with OpenClaw CLI: openclaw config set model {model}

    return NextResponse.json({
      success: true,
      message: `Model switched to ${model}`,
      previousModel: 'claude-opus-4-5', // Would be fetched from current config
      newModel: model,
    });
  } catch (error) {
    console.error('Failed to switch model:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to switch model',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
