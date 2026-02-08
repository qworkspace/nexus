import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

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
    // Try to fetch notifications from OpenClaw
    let notificationsResult: string;
    try {
      notificationsResult = execSync('openclaw notifications list --json 2>/dev/null || echo "[]"', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch {
      return getMockNotifications();
    }

    const notifications = JSON.parse(notificationsResult) as Notification[];
    const unread = notifications.filter(n => !n.read);
    const history = notifications.filter(n => n.read);

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
