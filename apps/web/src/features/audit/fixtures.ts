import type { AuditEntry } from './types';

/**
 * In-memory audit trail, standing in for the API until the real endpoint lands
 * (see ./api/audit-api.ts). The real audit_logs table is immutable and append-
 * only (PRD §3) — the viewer is read-only by design.
 */

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'al-1',
    actorName: 'Ada Lovelace',
    action: 'visitor.checked_in',
    targetType: 'visit',
    targetLabel: 'Maria Garcia',
    detail: 'Host: Sarah Chen · Badge ENT-4F2A1C',
    createdAt: minutesAgo(8),
  },
  {
    id: 'al-2',
    actorName: 'Ada Lovelace',
    action: 'visitor.flagged',
    targetType: 'visitor',
    targetLabel: 'Owen Walsh',
    detail: 'Tailgated through the lobby door behind another visitor.',
    createdAt: minutesAgo(35),
  },
  {
    id: 'al-3',
    actorName: 'Marcus Reed',
    action: 'override.approved',
    targetType: 'visit',
    targetLabel: 'Liang Wei',
    detail: 'After-hours check-in approved.',
    createdAt: minutesAgo(90),
  },
  {
    id: 'al-4',
    actorName: 'Ada Lovelace',
    action: 'override.requested',
    targetType: 'visit',
    targetLabel: 'Liang Wei',
    detail: 'Reason: contractor finishing critical deployment.',
    createdAt: minutesAgo(95),
  },
  {
    id: 'al-5',
    actorName: 'Ada Lovelace',
    action: 'visit.denied',
    targetType: 'visit',
    targetLabel: 'Dmitri Volkov',
    detail: 'Blocked visitor attempted check-in.',
    createdAt: minutesAgo(140),
  },
  {
    id: 'al-6',
    actorName: 'Priya Patel',
    action: 'visitor.blocked',
    targetType: 'visitor',
    targetLabel: 'Dmitri Volkov',
    detail: 'Prior security incident — escalated by front desk.',
    createdAt: minutesAgo(160),
  },
  {
    id: 'al-7',
    actorName: 'Ada Lovelace',
    action: 'visitor.checked_out',
    targetType: 'visit',
    targetLabel: 'Emma Thompson',
    detail: 'Duration 50m.',
    createdAt: minutesAgo(200),
  },
  {
    id: 'al-8',
    actorName: 'Marcus Reed',
    action: 'visitor.unblocked',
    targetType: 'visitor',
    targetLabel: 'Jordan Pike',
    detail: 'Block lifted after review.',
    createdAt: minutesAgo(1500),
  },
  {
    id: 'al-9',
    actorName: 'Ada Lovelace',
    action: 'visitor.flag_cleared',
    targetType: 'visitor',
    targetLabel: 'Sofia Marin',
    detail: 'Reviewed — no concern.',
    createdAt: minutesAgo(1600),
  },
];
