import { create } from 'zustand';
import type { User, Visitor } from '@entrio/types';
import * as api from '../api/check-in-api';
import type {
  CheckInResult,
  NewVisitorInput,
  SecurityCheckResult,
  VisitorSearchResult,
  WizardStep,
  WorkingHoursStatus,
} from '../types';

interface CheckInState {
  step: WizardStep;
  error: string | null;

  // Step 1 — search
  query: string;
  isSearching: boolean;
  results: VisitorSearchResult[];

  // Steps 2–3 — selection / creation
  selectedVisitor: Visitor | null;
  isNewVisitor: boolean;
  draft: NewVisitorInput;

  // Visit details (host + purpose) — needed for the §4.11 restriction check
  hosts: User[];
  hostId: string | null;
  purpose: string;
  isSavingVisitor: boolean;

  // Step 4 — working hours
  isCheckingHours: boolean;
  workingHours: WorkingHoursStatus | null;
  overrideReason: string;
  isRequestingOverride: boolean;
  isOverride: boolean;

  // Step 5 — security check
  isCheckingSecurity: boolean;
  security: SecurityCheckResult | null;

  // Step 6 — capture
  headshot: string | null;

  // Step 7 — confirmation
  isSubmitting: boolean;
  result: CheckInResult | null;

  // actions
  setQuery: (query: string) => void;
  search: () => Promise<void>;
  selectMatch: (visitor: Visitor) => void;
  startNewVisitor: () => void;
  setDraft: (patch: Partial<NewVisitorInput>) => void;
  loadHosts: () => Promise<void>;
  setHostId: (hostId: string) => void;
  setPurpose: (purpose: string) => void;
  confirmVisitor: () => Promise<void>;
  proceedFromWorkingHours: () => Promise<void>;
  setOverrideReason: (reason: string) => void;
  requestOverride: () => Promise<void>;
  reCheckSecurity: () => Promise<void>;
  setHeadshot: (dataUrl: string | null) => void;
  submit: () => Promise<void>;
  goTo: (step: WizardStep) => void;
  reset: () => void;
}

const emptyDraft: NewVisitorInput = { fullName: '', phone: '', email: null };

const initialState = {
  step: 'search' as WizardStep,
  error: null,
  query: '',
  isSearching: false,
  results: [] as VisitorSearchResult[],
  selectedVisitor: null as Visitor | null,
  isNewVisitor: false,
  draft: emptyDraft,
  hosts: [] as User[],
  hostId: null as string | null,
  purpose: '',
  isSavingVisitor: false,
  isCheckingHours: false,
  workingHours: null as WorkingHoursStatus | null,
  overrideReason: '',
  isRequestingOverride: false,
  isOverride: false,
  isCheckingSecurity: false,
  security: null as SecurityCheckResult | null,
  headshot: null as string | null,
  isSubmitting: false,
  result: null as CheckInResult | null,
};

export const useCheckInStore = create<CheckInState>((set, get) => ({
  ...initialState,

  setQuery: (query) => set({ query }),

  search: async () => {
    const query = get().query.trim();
    if (!query) return;
    set({ isSearching: true, error: null });
    try {
      const results = await api.searchVisitors(query);
      const onlyMatch = results[0];
      if (results.length > 1) {
        set({ results, step: 'disambiguation' });
      } else if (onlyMatch) {
        set({
          results,
          selectedVisitor: onlyMatch.visitor,
          isNewVisitor: false,
          step: 'confirm',
        });
      } else {
        // No match → register a new visitor, pre-filling the typed name (§4.1.3).
        set({
          results: [],
          isNewVisitor: true,
          selectedVisitor: null,
          draft: { ...emptyDraft, fullName: query },
          step: 'confirm',
        });
      }
    } catch {
      set({ error: 'Search failed. Please try again.' });
    } finally {
      set({ isSearching: false });
    }
  },

  selectMatch: (visitor) =>
    set({ selectedVisitor: visitor, isNewVisitor: false, step: 'confirm' }),

  startNewVisitor: () =>
    set({
      isNewVisitor: true,
      selectedVisitor: null,
      draft: { ...emptyDraft, fullName: get().query.trim() },
      step: 'confirm',
    }),

  setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),

  loadHosts: async () => {
    if (get().hosts.length > 0) return;
    try {
      const hosts = await api.getHosts();
      set({ hosts });
    } catch {
      set({ error: 'Could not load hosts.' });
    }
  },

  setHostId: (hostId) => set({ hostId }),
  setPurpose: (purpose) => set({ purpose }),

  confirmVisitor: async () => {
    set({ isSavingVisitor: true, error: null });
    try {
      let visitor = get().selectedVisitor;
      if (get().isNewVisitor) {
        visitor = await api.createVisitor(get().draft);
        set({ selectedVisitor: visitor });
      }
      // Move to the working-hours gate and evaluate it up front (§4.4 / §4.8).
      set({ isCheckingHours: true });
      const workingHours = await api.checkWorkingHours();
      set({ workingHours, step: 'working-hours' });
    } catch {
      set({ error: 'Could not save visitor details.' });
    } finally {
      set({ isSavingVisitor: false, isCheckingHours: false });
    }
  },

  proceedFromWorkingHours: async () => {
    // Called when the building is open, or after an approved override.
    const { selectedVisitor, hostId } = get();
    if (!selectedVisitor || !hostId) return;
    set({ isCheckingSecurity: true, error: null });
    try {
      const security = await api.runSecurityCheck(selectedVisitor.id, hostId);
      set({ security, step: 'security-check' });
    } catch {
      set({ error: 'Security check failed.' });
    } finally {
      set({ isCheckingSecurity: false });
    }
  },

  setOverrideReason: (overrideReason) => set({ overrideReason }),

  requestOverride: async () => {
    const reason = get().overrideReason.trim();
    if (!reason) return;
    set({ isRequestingOverride: true, error: null });
    try {
      const { approved } = await api.requestOverride(reason);
      if (approved) {
        set({ isOverride: true });
        await get().proceedFromWorkingHours();
      } else {
        set({ error: 'Override denied by supervisor.' });
      }
    } catch {
      set({ error: 'Override request failed.' });
    } finally {
      set({ isRequestingOverride: false });
    }
  },

  // Re-run after the host is changed in response to a §4.11 restriction.
  reCheckSecurity: async () => {
    const { selectedVisitor, hostId } = get();
    if (!selectedVisitor || !hostId) return;
    set({ isCheckingSecurity: true, error: null });
    try {
      const security = await api.runSecurityCheck(selectedVisitor.id, hostId);
      set({ security });
    } catch {
      set({ error: 'Security check failed.' });
    } finally {
      set({ isCheckingSecurity: false });
    }
  },

  setHeadshot: (headshot) => set({ headshot }),

  submit: async () => {
    const { selectedVisitor, hostId, purpose, headshot, isOverride } = get();
    if (!selectedVisitor || !hostId) return;
    set({ isSubmitting: true, error: null });
    try {
      const result = await api.submitCheckIn({
        visitorId: selectedVisitor.id,
        hostId,
        purpose,
        headshot,
        isOverride,
      });
      set({ result, step: 'confirmation' });
    } catch {
      set({ error: 'Check-in failed. Please try again.' });
    } finally {
      set({ isSubmitting: false });
    }
  },

  goTo: (step) => set({ step }),

  reset: () => set({ ...initialState, hosts: get().hosts }),
}));
