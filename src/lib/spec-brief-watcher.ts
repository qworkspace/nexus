/**
 * Spec-Brief File Watcher
 *
 * Monitors ~/.openclaw/shared/research/ai-intel/spec-briefs/ for new .md files
 * and auto-ingests them into the pipeline DB using the same logic as
 * POST /api/pipeline-queue/ingest.
 *
 * Uses Node's native fs.watch with debouncing to handle rapid file changes.
 */

import { watch, FSWatcher, existsSync, statSync } from 'fs';
import { SPEC_BRIEFS_DIR, ingestSingleFile } from './spec-brief-ingest';

let watcher: FSWatcher | null = null;
const debounceMap = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 2000; // 2 second debounce to handle chunked writes

/**
 * Check if a file is a valid spec-brief (md or summary.json)
 */
function isSpecBriefFile(filename: string): boolean {
  return filename.endsWith('.md') || filename.endsWith('.summary.json');
}

/**
 * Handle a new/changed file with debouncing
 */
function handleFile(filename: string): void {
  // Clear any existing debounce timer
  const existing = debounceMap.get(filename);
  if (existing) {
    clearTimeout(existing);
  }

  // Set new debounce timer
  debounceMap.set(
    filename,
    setTimeout(async () => {
      debounceMap.delete(filename);

      // Only process on 'add' events - avoid re-ingesting on edits
      // The debounce handles the case where file is written in chunks
      console.log(`[watcher] Processing new spec-brief: ${filename}`);

      try {
        const briefId = await ingestSingleFile(filename);
        if (briefId) {
          console.log(`[watcher] Ingested: ${briefId}`);
        } else {
          console.log(`[watcher] Skipped (already exists or invalid): ${filename}`);
        }
      } catch (e) {
        console.error(`[watcher] Error ingesting ${filename}:`, e);
      }
    }, DEBOUNCE_MS)
  );
}

/**
 * Start the file watcher.
 * Returns the watcher instance for cleanup.
 */
export function startSpecBriefWatcher(): FSWatcher | null {
  if (watcher) {
    console.log('[watcher] Already running');
    return watcher;
  }

  if (!existsSync(SPEC_BRIEFS_DIR)) {
    console.warn(`[watcher] Spec-briefs directory does not exist: ${SPEC_BRIEFS_DIR}`);
    // Create a watcher anyway - directory might be created later
  }

  try {
    watcher = watch(
      SPEC_BRIEFS_DIR,
      { persistent: true, recursive: false },
      (eventType, filename) => {
        if (!filename) return;

        // Only process 'rename' events which cover both add and delete
        // 'change' events fire on edits - we skip those to avoid re-ingesting
        if (eventType === 'rename' && isSpecBriefFile(filename)) {
          // Check if file exists (rename covers both add and delete)
          const filePath = `${SPEC_BRIEFS_DIR}/${filename}`;
          if (existsSync(filePath)) {
            try {
              // Verify it's a file, not a directory
              const stats = statSync(filePath);
              if (stats.isFile()) {
                handleFile(filename);
              }
            } catch {
              // File might have been deleted between check and stat
            }
          }
        }
      }
    );

    watcher.on('error', (error) => {
      console.error('[watcher] Error:', error);
    });

    console.log(`[watcher] Started monitoring: ${SPEC_BRIEFS_DIR}`);
    return watcher;
  } catch (error) {
    console.error('[watcher] Failed to start:', error);
    return null;
  }
}

/**
 * Stop the file watcher.
 */
export function stopSpecBriefWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log('[watcher] Stopped');
  }

  // Clear any pending debounce timers
  for (const timer of debounceMap.values()) {
    clearTimeout(timer);
  }
  debounceMap.clear();
}

/**
 * Check if the watcher is currently running.
 */
export function isWatcherRunning(): boolean {
  return watcher !== null;
}
