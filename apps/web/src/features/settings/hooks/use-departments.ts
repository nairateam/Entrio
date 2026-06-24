import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import * as api from '../api/departments-api';

export const departmentKeys = {
  all: ['departments'] as const,
};

export function useDepartments() {
  return useQuery({ queryKey: departmentKeys.all, queryFn: api.getDepartments });
}

export function useAddDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createDepartment(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success('Department added.');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not add the department.'),
  });
}

export function useRemoveDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success('Department removed.');
    },
    onError: () => toast.error('Could not remove the department.'),
  });
}
