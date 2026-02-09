import { LogViewer } from "@/components/logs/LogViewer";

export default function LogsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Logs</h1>
        <p className="text-zinc-400">
          Real-time view of OpenClaw gateway logs with filtering and search
        </p>
      </div>
      <LogViewer />
    </div>
  );
}
