import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import * as api from '../api/devices-api';

export const deviceKeys = {
  all: ['devices'] as const,
};

export function useDevices() {
  return useQuery({ queryKey: deviceKeys.all, queryFn: api.getDevices });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => api.createDevice(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
    onError: () => toast.error('Could not create the device.'),
  });
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.revokeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
      toast.success('Device revoked.');
    },
    onError: () => toast.error('Could not revoke the device.'),
  });
}
