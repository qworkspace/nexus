import { BugTrackerPanel } from '@/components/bugs/BugTrackerPanel';
import { bugService } from '@/lib/bugs';

export default async function BugsPage() {
  const { bugs } = await bugService.list({ limit: 100 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Bug Tracker
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Track and manage bugs across all projects
        </p>
      </div>

      <BugTrackerPanel bugs={bugs} />
    </div>
  );
}
