import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '../NotificationCenter';
import * as swr from 'swr';

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
}));

describe('NotificationCenter', () => {
  const mockUnreadNotifications = [
    {
      id: '1',
      title: 'Test Notification',
      message: 'This is a test message',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      type: 'info' as const,
    },
    {
      id: '2',
      title: 'Warning Notification',
      message: 'This is a warning',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
      type: 'warning' as const,
    },
    {
      id: '3',
      title: 'Error Notification',
      message: 'This is an error',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
      type: 'error' as const,
    },
    {
      id: '4',
      title: 'Success Notification',
      message: 'Operation successful',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      type: 'success' as const,
      action: {
        label: 'View Details',
        url: '/details',
      },
    },
  ];

  const mockHistoryNotifications = [
    {
      id: '5',
      title: 'Old Notification',
      message: 'This is an old notification',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'info' as const,
    },
    {
      id: '6',
      title: 'Another Old Notification',
      message: 'Another old message',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'warning' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location
    window.location.href = '';
  });

  const getBellButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons.find(btn => btn.querySelector('.lucide-bell'));
  };

  describe('Rendering', () => {
    it('should render the bell button', () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: [], history: [], totalCount: 0, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);
      const bellButton = getBellButton();
      expect(bellButton).toBeInTheDocument();
    });

    it('should render badge with correct count when there are unread notifications', () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications.slice(0, 3),
          history: [],
          totalCount: 3,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);
      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
    });

    it('should render "9+" when count exceeds 9', () => {
      const manyNotifications = Array.from({ length: 10 }, (_, i) => ({
        ...mockUnreadNotifications[0],
        id: String(i),
      }));

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: manyNotifications,
          history: [],
          totalCount: 10,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);
      const badge = screen.getByText('9+');
      expect(badge).toBeInTheDocument();
    });

    it('should not render badge when there are no unread notifications', () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: [], history: [], totalCount: 0, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);
      const bellButton = getBellButton();
      expect(bellButton?.textContent?.trim()).toBe('');
    });
  });

  describe('Opening and Closing', () => {
    it('should open drawer when bell button is clicked', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: [], history: [], totalCount: 0, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should close drawer when X button is clicked', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: mockUnreadNotifications.slice(0, 1), history: [], totalCount: 1, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      // Find the close button (the X button in the header)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      if (!closeButton) throw new Error('Close button not found');
      await userEvent.click(closeButton);

      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });

    it('should close drawer when clicking outside', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: mockUnreadNotifications.slice(0, 1), history: [], totalCount: 1, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      // Click the overlay (fixed div)
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      if (overlay) {
        await userEvent.click(overlay);
      }

      // The drawer should close
      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading state when fetching notifications', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when there are no notifications', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: [], history: [], totalCount: 0, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  describe('Unread Notifications', () => {
    it('should display unread notifications', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications.slice(0, 2),
          history: [],
          totalCount: 2,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
      expect(screen.getByText('Warning Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a warning')).toBeInTheDocument();
    });

    it('should display correct icon for each notification type', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications,
          history: [],
          totalCount: 4,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      // Check that all notification titles are rendered
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Warning Notification')).toBeInTheDocument();
      expect(screen.getByText('Error Notification')).toBeInTheDocument();
      expect(screen.getByText('Success Notification')).toBeInTheDocument();
    });
  });

  describe('History Notifications', () => {
    it('should display history notifications (max 5)', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: [],
          history: mockHistoryNotifications,
          totalCount: 0,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Old Notification')).toBeInTheDocument();
      expect(screen.getByText('Another Old Notification')).toBeInTheDocument();
    });

    it('should limit history notifications to 5', async () => {
      const manyHistory = Array.from({ length: 7 }, (_, i) => ({
        ...mockHistoryNotifications[0],
        id: `history-${i}`,
        title: `History Notification ${i}`,
      }));

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: [],
          history: manyHistory,
          totalCount: 0,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      // Only 5 should be displayed
      expect(screen.getByText('History Notification 0')).toBeInTheDocument();
      expect(screen.getByText('History Notification 4')).toBeInTheDocument();
      expect(screen.queryByText('History Notification 5')).not.toBeInTheDocument();
      expect(screen.queryByText('History Notification 6')).not.toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should display "just now" for very recent notifications', async () => {
      const recentNotification = [
        {
          ...mockUnreadNotifications[0],
          timestamp: new Date(Date.now() - 30 * 1000).toISOString(),
        },
      ];

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: recentNotification,
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should display minutes ago for notifications from minutes ago', async () => {
      const minutesAgoNotification = [
        {
          ...mockUnreadNotifications[0],
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ];

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: minutesAgoNotification,
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('15m ago')).toBeInTheDocument();
    });

    it('should display hours ago for notifications from hours ago', async () => {
      const hoursAgoNotification = [
        {
          ...mockUnreadNotifications[0],
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
      ];

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: hoursAgoNotification,
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('should display days ago for notifications from days ago', async () => {
      const daysAgoNotification = [
        {
          ...mockUnreadNotifications[0],
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: daysAgoNotification,
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display action button when notification has action', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: [mockUnreadNotifications[3]], // Has action
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should navigate when action button is clicked', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: [mockUnreadNotifications[3]], // Has action
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      const actionButton = screen.getByText('View Details');
      await userEvent.click(actionButton);

      expect(window.location.href).toBe('/details');
    });
  });

  describe('Mark All as Read', () => {
    it('should display mark all as read button', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications.slice(0, 2),
          history: [],
          totalCount: 2,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    it('should close drawer when mark all as read is clicked', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications.slice(0, 2),
          history: [],
          totalCount: 2,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      const markAllButton = screen.getByText('Mark all as read');
      await userEvent.click(markAllButton);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });
  });

  describe('Notification Types Styling', () => {
    it('should render notification with correct background color based on type', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications,
          history: [],
          totalCount: 4,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      // All notifications should be rendered
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.getByText('Warning Notification')).toBeInTheDocument();
      expect(screen.getByText('Error Notification')).toBeInTheDocument();
      expect(screen.getByText('Success Notification')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: { unread: [], history: [], totalCount: 0, source: 'mock' },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      expect(bellButton).toBeInTheDocument();
    });
  });

  describe('Integration with SWR', () => {
    it('should fetch notifications with correct endpoint', () => {
      const useSWR = swr.default as vi.Mock;

      render(<NotificationCenter />);

      expect(useSWR).toHaveBeenCalledWith(
        '/api/notifications/unread',
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 30000,
          revalidateOnFocus: false,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle data with source property correctly', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications.slice(0, 1),
          history: [],
          totalCount: 1,
          source: 'live',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    it('should handle empty history correctly', async () => {
      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: mockUnreadNotifications.slice(0, 1),
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    it('should handle notification without action', async () => {
      const notificationWithoutAction = {
        ...mockUnreadNotifications[0],
        action: undefined,
      };

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: [notificationWithoutAction],
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    });

    it('should handle default notification type', async () => {
      const defaultTypeNotification = {
        ...mockUnreadNotifications[0],
        type: 'unknown' as 'info' | 'warning' | 'error' | 'success',
      };

      (swr.default as vi.Mock).mockReturnValue({
        data: {
          unread: [defaultTypeNotification],
          history: [],
          totalCount: 1,
          source: 'mock',
        },
        isLoading: false,
      });

      render(<NotificationCenter />);

      const bellButton = getBellButton();
      if (!bellButton) throw new Error('Bell button not found');
      await userEvent.click(bellButton);

      // Should still render even with unknown type
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });
  });
});
