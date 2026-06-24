import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import * as api from '../api/users-api';
import type { UsersQuery } from '../api/users-api';
import type { InviteInput } from '../schema';

export const userKeys = {
  all: ['users'] as const,
  list: (q: UsersQuery) => ['users', q] as const,
};

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => api.getUsers(query),
    placeholderData: keepPreviousData,
  });
}

/** Department pick-list for the invite form. Shares the ['departments'] cache. */
export function useDepartmentOptions() {
  return useQuery({ queryKey: ['departments'], queryFn: api.getDepartmentOptions });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.setUserActive(id, isActive),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(vars.isActive ? 'User activated.' : 'User deactivated.');
    },
    onError: () => toast.error('Could not update the user.'),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteInput) => api.inviteUser(input),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      // A new department may have been created from a typed value.
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`Invited ${user.fullName}.`);
    },
  });
}
