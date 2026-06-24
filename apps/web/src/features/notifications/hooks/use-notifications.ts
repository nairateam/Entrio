import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/notifications-api';

export const notificationKeys = {
  all: ['notifications'] as const,
};

/** The current user's inbox — polls so new alerts appear without a refresh. */
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: api.getNotifications,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
