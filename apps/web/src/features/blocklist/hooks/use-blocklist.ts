import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import * as api from '../api/blocklist-api';
import type { BlocklistQuery } from '../api/blocklist-api';

export const blocklistKeys = {
  blocked: ['blocklist', 'blocked'] as const,
  flagged: ['blocklist', 'flagged'] as const,
  blockedList: (q: BlocklistQuery) => ['blocklist', 'blocked', q] as const,
  flaggedList: (q: BlocklistQuery) => ['blocklist', 'flagged', q] as const,
};

export function useBlockedVisitors(query: BlocklistQuery) {
  return useQuery({
    queryKey: blocklistKeys.blockedList(query),
    queryFn: () => api.getBlockedVisitors(query),
    placeholderData: keepPreviousData,
  });
}

export function useFlaggedVisitors(query: BlocklistQuery) {
  return useQuery({
    queryKey: blocklistKeys.flaggedList(query),
    queryFn: () => api.getFlaggedVisitors(query),
    placeholderData: keepPreviousData,
  });
}

/** Invalidate both lists — block/unblock/clear can move a visitor between them. */
function useBlocklistMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>, success: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocklistKeys.blocked });
      queryClient.invalidateQueries({ queryKey: blocklistKeys.flagged });
      toast.success(success);
    },
    onError: () => toast.error('Action failed. Please try again.'),
  });
}

export function useBlockVisitor() {
  return useBlocklistMutation(
    ({ id, reason }: { id: string; reason: string }) => api.blockVisitor(id, reason),
    'Visitor blocked.',
  );
}

export function useUnblockVisitor() {
  return useBlocklistMutation((id: string) => api.unblockVisitor(id), 'Block removed.');
}

export function useClearFlag() {
  return useBlocklistMutation((id: string) => api.clearFlag(id), 'Flag cleared.');
}
