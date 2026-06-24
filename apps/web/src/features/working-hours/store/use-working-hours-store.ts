import { create } from 'zustand';
import { toast } from '@/components/ui';
import * as api from '../api/working-hours-api';
import type { BlackoutDate, WorkingHour } from '../types';

interface WorkingHoursState {
  hours: WorkingHour[];
  blackouts: BlackoutDate[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  load: () => Promise<void>;
  setHour: (dayOfWeek: number, patch: Partial<WorkingHour>) => void;
  saveHours: () => Promise<void>;
  addBlackout: (input: { date: string; reason: string }) => Promise<void>;
  removeBlackout: (id: string) => Promise<void>;
}

export const useWorkingHoursStore = create<WorkingHoursState>((set, get) => ({
  hours: [],
  blackouts: [],
  isLoading: false,
  isSaving: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [hours, blackouts] = await Promise.all([
        api.getWorkingHours(),
        api.getBlackoutDates(),
      ]);
      set({ hours, blackouts });
    } catch {
      set({ error: 'Could not load working hours.' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Local edit; persisted by saveHours().
  setHour: (dayOfWeek, patch) =>
    set((s) => ({
      hours: s.hours.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)),
    })),

  saveHours: async () => {
    set({ isSaving: true, error: null });
    try {
      const saved = await api.updateWorkingHours(get().hours);
      set({ hours: saved });
      toast.success('Working hours saved.');
    } catch {
      set({ error: 'Could not save working hours.' });
      toast.error('Could not save working hours.');
    } finally {
      set({ isSaving: false });
    }
  },

  addBlackout: async (input) => {
    try {
      await api.addBlackoutDate(input);
      set({ blackouts: await api.getBlackoutDates() });
      toast.success('Blackout date added.');
    } catch {
      toast.error('Could not add blackout date.');
    }
  },

  removeBlackout: async (id) => {
    try {
      await api.removeBlackoutDate(id);
      set({ blackouts: get().blackouts.filter((b) => b.id !== id) });
      toast.success('Blackout date removed.');
    } catch {
      toast.error('Could not remove blackout date.');
    }
  },
}));
