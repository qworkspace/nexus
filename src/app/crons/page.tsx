"use client";

import { useState } from "react";
import { CronList } from "@/components/crons/CronList";
import { CronTimeline } from "@/components/crons/CronTimeline";
import { CronDetails } from "@/components/crons/CronDetails";
import { mockCronJobs } from "@/lib/cron-mock";

export default function CronDashboard() {
  // Sort jobs by next run time
  const sortedJobs = [...mockCronJobs].sort((a, b) => 
    new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime()
  );
  
  const [selectedJob, setSelectedJob] = useState<typeof sortedJobs[0] | null>(sortedJobs[0]);

  const handleSelectJob = (job: typeof sortedJobs[0]) => {
    setSelectedJob(job);
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Cron Jobs</h1>
        <p className="text-zinc-500 text-sm">
          Manage and monitor scheduled tasks
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Job List */}
        <div className="col-span-1">
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">All Jobs ({sortedJobs.length})</h2>
          <CronList
            jobs={sortedJobs}
            selectedJob={selectedJob}
            onSelectJob={handleSelectJob}
          />
        </div>

        {/* Timeline and Details */}
        <div className="col-span-2 space-y-6">
          {/* Timeline */}
          <CronTimeline jobs={sortedJobs} />

          {/* Details Panel */}
          <CronDetails job={selectedJob} />
        </div>
      </div>
    </div>
  );
}
