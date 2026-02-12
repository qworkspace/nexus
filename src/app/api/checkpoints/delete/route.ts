import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { homedir } from 'os';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dateDir = searchParams.get('date');

    if (!id || !dateDir) {
      return NextResponse.json(
        { error: 'Missing id or date parameter' },
        { status: 400 }
      );
    }

    const filePath = path.join(homedir(), 'shared', 'checkpoints', dateDir, id);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Checkpoint not found' },
        { status: 404 }
      );
    }

    // Delete the checkpoint
    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'Checkpoint deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting checkpoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete checkpoint', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
