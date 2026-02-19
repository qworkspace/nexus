"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Check, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import useSWR from "swr";

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

interface NotificationsResponse {
  source: 'live' | 'mock' | 'error';
  unread: Notification[];
  history: Notification[];
  totalCount: number;
}

async function fetcher(url: string): Promise<NotificationsResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useSWR<NotificationsResponse>(
    '/api/notifications/unread',
    fetcher,
    {
      refreshInterval: 30000, // 30-second refresh
      revalidateOnFocus: false,
    }
  );

  const unread = data?.unread || [];
  const history = data?.history || [];
  const totalCount = unread.length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'info':
        return "text-zinc-500";
      case 'warning':
        return "text-zinc-400";
      case 'error':
        return "text-zinc-500";
      case 'success':
        return "text-zinc-500";
      default:
        return "text-zinc-500";
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'info':
        return "bg-zinc-50";
      case 'warning':
        return "bg-zinc-50";
      case 'error':
        return "bg-zinc-50";
      case 'success':
        return "bg-zinc-50";
      default:
        return "bg-zinc-50";
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {totalCount > 9 ? '9+' : totalCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full z-50 w-80 mt-2 shadow-xl">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-zinc-200">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    Loading...
                  </div>
                ) : unread.length === 0 && history.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200">
                    {/* Unread */}
                    {unread.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 ${getBgColor(notification.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-zinc-600 mt-0.5">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">
                                {getTimeAgo(notification.timestamp)}
                              </span>
                              {notification.action && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => {
                                    window.location.href = notification.action!.url;
                                  }}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Read */}
                    {history.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 bg-zinc-50 opacity-75"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-700">
                              {notification.title}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {notification.message}
                            </p>
                            <span className="text-xs text-zinc-400">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-zinc-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    // Mark all as read (would need API call)
                    setIsOpen(false);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all as read
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
