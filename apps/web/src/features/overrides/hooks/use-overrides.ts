import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import * as api from '../api/overrides-api';

export const overrideKeys = {
  all: ['overrides'] as const,
};

export function useOverrides() {
  return useQuery({ queryKey: overrideKeys.all, queryFn: api.getOverrideRequests });
}

export function useApproveOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approveOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overrideKeys.all });
      toast.success('Override approved.');
    },
    onError: () => toast.error('Could not approve the request.'),
  });
}

export function useDenyOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.denyOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overrideKeys.all });
      toast.success('Override denied.');
    },
    onError: () => toast.error('Could not deny the request.'),
  });
}
