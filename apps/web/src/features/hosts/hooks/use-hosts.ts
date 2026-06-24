import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import * as api from '../api/hosts-api';
import type { HostVisitsQuery } from '../api/hosts-api';
import type { PreRegisterInput, RestrictionInput } from '../schema';

// Endpoints are "me"-scoped server-side; the arg is ignored (kept for the api sig).
const ME = 'me';

export const hostKeys = {
  visits: ['hosts', 'visits'] as const,
  visitsPaged: (q: HostVisitsQuery) => ['hosts', 'visits', 'paged', q] as const,
  restrictions: ['hosts', 'restrictions'] as const,
};

export function useHostVisits() {
  return useQuery({ queryKey: hostKeys.visits, queryFn: () => api.getHostVisits(ME) });
}

export function useHostVisitsPaged(query: HostVisitsQuery) {
  return useQuery({
    queryKey: hostKeys.visitsPaged(query),
    queryFn: () => api.getHostVisitsPaged(query),
    placeholderData: keepPreviousData,
  });
}

export function usePreRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PreRegisterInput) => api.preRegisterVisit(ME, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostKeys.visits }),
  });
}

export function useMarkOnMyWay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => api.markOnMyWay(visitId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostKeys.visits }),
    onError: () => toast.error('Could not update status. Please try again.'),
  });
}

/** Quick replies a host can send to the front desk (PRD §4.5). */
export const HOST_RESPONSES = [
  'On my way down.',
  'Please have them wait in reception.',
  'Send them up.',
  "I'll be a few minutes.",
  "I can't meet right now — please reschedule.",
] as const;

export function useRespondToVisit() {
  return useMutation({
    mutationFn: ({ visitId, message }: { visitId: string; message: string }) =>
      api.respondToVisit(visitId, message),
    onSuccess: () => toast.success('Sent to the front desk.'),
    onError: () => toast.error('Could not send your response.'),
  });
}

export function useRestrictions() {
  return useQuery({ queryKey: hostKeys.restrictions, queryFn: () => api.getRestrictions(ME) });
}

export function useAddRestriction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RestrictionInput) => api.addRestriction(ME, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostKeys.restrictions });
      toast.success('Restriction added.');
    },
  });
}

export function useLiftRestriction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.liftRestriction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostKeys.restrictions });
      toast.success('Restriction lifted.');
    },
    onError: () => toast.error('Could not lift the restriction.'),
  });
}
