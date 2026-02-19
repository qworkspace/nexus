"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-zinc-200">Dashboard Error</h2>
        <p className="text-sm text-zinc-400 max-w-md">{error.message || "An unexpected error occurred"}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
