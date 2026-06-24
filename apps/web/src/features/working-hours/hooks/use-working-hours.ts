import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import * as api from '../api/working-hours-api';
import type { WorkingHour } from '../types';

export const workingHoursKeys = {
  hours: ['working-hours', 'hours'] as const,
  blackouts: ['working-hours', 'blackouts'] as const,
};

export function useWorkingHours() {
  return useQuery({ queryKey: workingHoursKeys.hours, queryFn: api.getWorkingHours });
}

export function useBlackoutDates() {
  return useQuery({ queryKey: workingHoursKeys.blackouts, queryFn: api.getBlackoutDates });
}

export function useSaveWorkingHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: WorkingHour[]) => api.updateWorkingHours(hours),
    onSuccess: (saved) => {
      queryClient.setQueryData(workingHoursKeys.hours, saved);
      toast.success('Working hours saved.');
    },
    onError: () => toast.error('Could not save working hours.'),
  });
}

export function useAddBlackout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; reason: string }) => api.addBlackoutDate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.blackouts });
      toast.success('Blackout date added.');
    },
    onError: () => toast.error('Could not add blackout date.'),
  });
}

export function useRemoveBlackout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeBlackoutDate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.blackouts });
      toast.success('Blackout date removed.');
    },
    onError: () => toast.error('Could not remove blackout date.'),
  });
}
