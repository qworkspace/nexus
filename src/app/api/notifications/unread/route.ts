import { NextResponse } from 'next/server';
import { getPendingHandoffs, fetchCronJobs, aggregateUsageFromTranscripts } from '@/lib/data-utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
  action?: {
    label: string;
    url: string;
  };
}

interface UnreadNotificationsResponse {
  source: 'live' | 'mock' | 'error';
  unread: Notification[];
  history: Notification[];
  totalCount: number;
  error?: string;
}

async function getNotifications(): Promise<UnreadNotificationsResponse> {
  try {
    const notifications: Notification[] = [];

    // 1. Check pending handoffs
    const handoffNotifs = await checkHandoffs();
    notifications.push(...handoffNotifs);

    // 2. Check cron failures
    const cronNotifs = await checkCronFailures();
    notifications.push(...cronNotifs);

    // 3. Check high costs
    const costNotifs = await checkHighCosts();
    notifications.push(...costNotifs);

    // Sort by timestamp (most recent first)
    notifications.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Split into unread and history (all are unread for now)
    const unread = notifications;
    const history: Notification[] = [];

    return {
      source: 'live',
      unread,
      history,
      totalCount: unread.length,
    };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return getMockNotifications();
  }
}

async function checkHandoffs(): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    const pendingHandoffs = await getPendingHandoffs();

    for (const handoff of pendingHandoffs) {
      notifications.push({
        id: `handoff-${handoff.id}`,
        title: 'Pending Handoff',
        message: `${handoff.from} → ${handoff.to}: ${handoff.spec}`,
        timestamp: handoff.createdAt || new Date().toISOString(),
        read: false,
        type: 'info',
        action: {
          label: 'View Spec',
          url: `/specs/${handoff.id}`,
        },
      });
    }
  } catch (error) {
    console.error('Failed to check handoffs:', error);
  }

  return notifications;
}

async function checkCronFailures(): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    const cronData = await fetchCronJobs();

    for (const job of cronData.jobs || []) {
      const state = job.state as {
        lastStatus?: string;
        lastRunAtMs?: number;
        lastDurationMs?: number;
      } | undefined;

      if (state?.lastStatus === 'error') {
        notifications.push({
          id: `cron-error-${job.id}`,
          title: 'Cron Job Failed',
          message: `${job.name} failed at last run`,
          timestamp: new Date(state.lastRunAtMs || Date.now()).toISOString(),
          read: false,
          type: 'error',
          action: {
            label: 'View Logs',
            url: `/crons/${job.id}/runs`,
          },
        });
      } else if (state?.lastDurationMs && state.lastDurationMs > 60000) {
        notifications.push({
          id: `cron-slow-${job.id}`,
          title: 'Cron Job Slow',
          message: `${job.name} took ${Math.round(state.lastDurationMs / 1000)}s (expected <60s)`,
          timestamp: new Date(state.lastRunAtMs || Date.now()).toISOString(),
          read: false,
          type: 'warning',
        });
      }
    }
  } catch (error) {
    console.error('Failed to check cron failures:', error);
  }

  return notifications;
}

async function checkHighCosts(): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // Get today's costs from transcripts
    const todayUsage = await aggregateUsageFromTranscripts(todayStart, new Date());
    const todayCost = todayUsage.reduce((sum, u) => sum + u.cost, 0);

    // Warn if today's cost > $5
    if (todayCost > 5) {
      notifications.push({
        id: 'high-cost-today',
        title: 'High Token Usage',
        message: `Today's cost: $${todayCost.toFixed(2)}. Consider using cheaper models.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'warning',
      });
    }

    // Warn if Opus usage is high
    const opusUsage = todayUsage.filter(u => u.model.includes('opus'));
    const opusCost = opusUsage.reduce((sum, u) => sum + u.cost, 0);

    if (opusCost > 3) {
      notifications.push({
        id: 'high-opus-usage',
        title: 'High Opus Usage',
        message: `Opus cost today: $${opusCost.toFixed(2)}. Switch to Sonnet for routine tasks.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'warning',
      });
    }
  } catch (error) {
    console.error('Failed to check costs:', error);
  }

  return notifications;
}

function getMockNotifications(): UnreadNotificationsResponse {
  const now = Date.now();
  const unread: Notification[] = [
    {
      id: 'notif-1',
      title: 'Agent Task Complete',
      message: 'Dev Agent (cryptomon-market) completed "Build Market Overview"',
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      read: false,
      type: 'success',
      action: {
        label: 'View Results',
        url: '/agents',
      },
    },
    {
      id: 'notif-2',
      title: 'High Token Usage Warning',
      message: 'Opus usage today: $5.25. Consider switching to Sonnet for routine tasks.',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      read: false,
      type: 'warning',
    },
    {
      id: 'notif-3',
      title: 'Cron Job Warning',
      message: 'Morning Brief ran slower than expected (45s vs 30s expected)',
      timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      read: false,
      type: 'warning',
    },
  ];

  const history: Notification[] = [
    {
      id: 'notif-4',
      title: 'Memory Updated',
      message: '5 new memories indexed from Cohera codebase',
      timestamp: new Date(now - 3600000).toISOString(),
      read: true,
      type: 'info',
    },
    {
      id: 'notif-5',
      title: 'Build Successful',
      message: 'CryptoMon dashboard build completed successfully',
      timestamp: new Date(now - 7200000).toISOString(),
      read: true,
      type: 'success',
    },
  ];

  return {
    source: 'mock',
    unread,
    history,
    totalCount: unread.length,
  };
}

export async function GET(): Promise<NextResponse<UnreadNotificationsResponse>> {
  const data = await getNotifications();
  return NextResponse.json(data);
}
