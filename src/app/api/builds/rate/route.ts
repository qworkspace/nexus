import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';

interface Rating {
  commitHash: string;
  rating: number;
  commitMessage: string;
  timestamp: string;
}

interface Feedback {
  ratings: Rating[];
}

const FEEDBACK_FILE = '/Users/paulvillanueva/shared/pipeline/build-feedback.json';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { commitHash, rating, commitMessage } = body;

    if (typeof commitHash !== 'string' || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Read existing feedback
    let feedback: Feedback = { ratings: [] };
    try {
      const data = await readFile(FEEDBACK_FILE, 'utf-8');
      feedback = JSON.parse(data);
    } catch {
      // File doesn't exist yet, use empty structure
    }

    // Check if this commit is already rated and update if so
    const existingIndex = feedback.ratings.findIndex(
      (r) => r.commitHash === commitHash
    );

    const ratingEntry: Rating = {
      commitHash,
      rating,
      commitMessage: commitMessage || '',
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      feedback.ratings[existingIndex] = ratingEntry;
    } else {
      feedback.ratings.push(ratingEntry);
    }

    // Write back to file
    await writeFile(FEEDBACK_FILE, JSON.stringify(feedback, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}
