import { NextRequest, NextResponse } from "next/server";
import { getOccurrencesInRange } from "@/lib/cron-parser";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  command?: string;
}

async function getCronJobs(): Promise<CronJob[]> {
  try {
    // Try to get cron jobs from OpenClaw CLI
    const { stdout } = await execAsync("openclaw cron list --json 2>/dev/null || echo '[]'");
    const jobs = JSON.parse(stdout.trim() || "[]");
    return jobs;
  } catch (error) {
    console.error("Failed to fetch cron jobs:", error);
    // Return sample data for development
    return [
      {
        id: "morning-brief",
        name: "Morning Brief",
        schedule: "0 7 * * *",
        enabled: true,
      },
      {
        id: "morning-mode",
        name: "Morning Mode",
        schedule: "0 7 * * *",
        enabled: true,
      },
      {
        id: "discord-digest-morning",
        name: "Discord Digest (Morning)",
        schedule: "0 9 * * *",
        enabled: true,
      },
      {
        id: "discord-digest-evening",
        name: "Discord Digest (Evening)",
        schedule: "0 18 * * *",
        enabled: true,
      },
      {
        id: "night-mode",
        name: "Night Mode",
        schedule: "0 23 * * *",
        enabled: true,
      },
      {
        id: "dj-discovery",
        name: "DJ Discovery",
        schedule: "0 10 * * 0",
        enabled: true,
      },
    ];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "Missing from or to parameter" },
      { status: 400 }
    );
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  const jobs = await getCronJobs();

  // Calculate occurrences for each job in the date range
  const events = jobs
    .filter((job) => job.enabled)
    .flatMap((job) => {
      const occurrences = getOccurrencesInRange(job.schedule, from, to);
      return occurrences.map((date) => ({
        id: `${job.id}-${date.getTime()}`,
        jobId: job.id,
        name: job.name,
        schedule: job.schedule,
        datetime: date.toISOString(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        dayOfWeek: date.getDay(),
      }));
    });

  return NextResponse.json({
    jobs,
    events,
    from: from.toISOString(),
    to: to.toISOString(),
  });
}
