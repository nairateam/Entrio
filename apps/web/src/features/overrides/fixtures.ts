import type { OverrideRequest } from './types';

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();

/** Mock override requests — two pending, plus resolved history. */
export const MOCK_OVERRIDE_REQUESTS: OverrideRequest[] = [
  {
    id: 'ov-1',
    visitorName: 'Liang Wei',
    hostName: 'Priya Patel',
    requestedByName: 'Sam Okonkwo',
    reason: 'Contractor finishing a critical deployment after hours.',
    requestedAt: minutesAgo(6),
    status: 'pending',
    resolvedByName: null,
    resolvedAt: null,
  },
  {
    id: 'ov-2',
    visitorName: 'Hannah Berg',
    hostName: 'Sarah Chen',
    requestedByName: 'Sam Okonkwo',
    reason: 'Early delivery arrived before opening.',
    requestedAt: minutesAgo(20),
    status: 'pending',
    resolvedByName: null,
    resolvedAt: null,
  },
  {
    id: 'ov-3',
    visitorName: 'Tom Becker',
    hostName: 'Marcus Reed',
    requestedByName: 'Sam Okonkwo',
    reason: 'Weekend audit visit.',
    requestedAt: minutesAgo(1500),
    status: 'approved',
    resolvedByName: 'Ada Lovelace',
    resolvedAt: minutesAgo(1490),
  },
  {
    id: 'ov-4',
    visitorName: 'Unknown caller',
    hostName: 'Priya Patel',
    requestedByName: 'Sam Okonkwo',
    reason: 'No appointment, host unreachable.',
    requestedAt: minutesAgo(1600),
    status: 'denied',
    resolvedByName: 'Ada Lovelace',
    resolvedAt: minutesAgo(1595),
  },
];
