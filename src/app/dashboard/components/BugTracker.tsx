"use client";

import { BugStats } from "./BugStats";
import { BugList } from "./BugList";

export function BugTracker() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1">
        <BugStats />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <BugList />
      </div>
    </div>
  );
}
