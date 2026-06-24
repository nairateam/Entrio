import type { AdminVisitor } from './types';

/**
 * In-memory visitor records for admin block/flag management, standing in for the
 * API until the real endpoints land (see ./api/blocklist-api.ts). Includes
 * already-blocked visitors and flagged-for-review visitors (one flagged record
 * is a candidate for escalation to a block).
 */

const base = {
  email: null,
  photoUrl: null,
  isBlocked: false,
  blockReason: null,
  blockedByName: null,
  blockedAt: null,
  isFlagged: false,
  flagNote: null,
  flaggedByName: null,
  flaggedAt: null,
} satisfies Partial<AdminVisitor>;

export const MOCK_ADMIN_VISITORS: AdminVisitor[] = [
  {
    ...base,
    id: 'vis-4',
    fullName: 'Dmitri Volkov',
    phone: '+1 555 0666',
    isBlocked: true,
    blockReason: 'Prior security incident — escalated by front desk.',
    blockedByName: 'Priya Patel',
    blockedAt: '2026-05-30T10:15:00.000Z',
  },
  {
    ...base,
    id: 'vis-9',
    fullName: 'Raymond Cole',
    phone: '+1 555 0312',
    isBlocked: true,
    blockReason: 'Repeated harassment of staff.',
    blockedByName: 'Marcus Reed',
    blockedAt: '2026-06-11T14:40:00.000Z',
  },
  {
    ...base,
    id: 'vis-12',
    fullName: 'Nina Brandt',
    phone: '+1 555 0421',
    isFlagged: true,
    flagNote: 'Refused to confirm host on last visit. Watch on next arrival.',
    flaggedByName: 'Ada Lovelace',
    flaggedAt: '2026-06-20T09:05:00.000Z',
  },
  {
    ...base,
    id: 'vis-13',
    fullName: 'Owen Walsh',
    phone: '+1 555 0455',
    isFlagged: true,
    flagNote: 'Tailgated through the lobby door behind another visitor.',
    flaggedByName: 'Ada Lovelace',
    flaggedAt: '2026-06-22T16:30:00.000Z',
  },
];
