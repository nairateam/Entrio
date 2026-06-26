import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/live-board-api';

/** Query keys for the live board. Exported so mutations elsewhere can invalidate. */
export const visitsKeys = {
  today: ['visits', 'today'] as const,
};

/** Today's board — polls so a front-desk display self-updates without a refresh. */
export function useTodayVisits() {
  return useQuery({
    queryKey: visitsKeys.today,
    queryFn: api.getTodayVisits,
    refetchInterval: 20_000,
  });
}

/** Check a visitor out, then refresh the board. */
export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => api.checkOutVisit(visitId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitsKeys.today }),
  });
}

/** Flag a visitor for review, then refresh the board. */
export function useFlagVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitorId, note }: { visitorId: string; note: string }) =>
      api.flagVisit(visitorId, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitsKeys.today }),
  });
}

/** Staff host directory (for assigning a walk-in's host). Cached briefly. */
export function useHostDirectory() {
  return useQuery({
    queryKey: ['hosts', 'directory'],
    queryFn: api.getHostDirectory,
    staleTime: 5 * 60 * 1000,
  });
}

/** Assign a host to a walk-in, then refresh the board. */
export function useAssignHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, hostId }: { visitId: string; hostId: string }) =>
      api.assignHost(visitId, hostId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitsKeys.today }),
  });
}
