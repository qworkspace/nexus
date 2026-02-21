/**
 * Next.js Instrumentation Hook
 *
 * Runs on server startup. Used to initialize the spec-brief file watcher
 * so new briefs are auto-ingested without manual intervention.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server, not during build
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSpecBriefWatcher } = await import('./lib/spec-brief-watcher');
    startSpecBriefWatcher();
    console.log('[instrumentation] Spec-brief watcher initialized');
  }
}
