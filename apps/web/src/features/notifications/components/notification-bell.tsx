'use client';

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';
import { usePushNotifications } from '../hooks/use-push-notifications';

export function NotificationBell() {
  const { data: items = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const push = usePushNotifications();
  const [open, setOpen] = useState(false);

  const unread = items.filter((n) => !n.read).length;
  const showEnablePush = push.supported && push.permission !== 'granted';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {showEnablePush && (
              <button
                type="button"
                onClick={() => void push.subscribe()}
                disabled={push.isSubscribing}
                className="flex w-full items-center gap-2 border-b border-border bg-accent/30 px-4 py-2.5 text-left text-sm hover:bg-accent disabled:opacity-60"
              >
                <BellRing className="h-4 w-4 text-primary" />
                <span>
                  {push.isSubscribing ? 'Enabling…' : 'Enable push notifications on this device'}
                </span>
              </button>
            )}
            <ul className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications.
                </li>
              ) : (
                items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead.mutate(n.id)}
                      className={cn(
                        'flex w-full gap-2 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent',
                        !n.read && 'bg-accent/40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.read ? 'bg-transparent' : 'bg-primary',
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{n.title}</span>
                        <span className="block text-sm text-muted-foreground">{n.body}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
