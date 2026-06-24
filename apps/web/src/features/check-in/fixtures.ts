import { UserRole, VisitStatus, type User, type Visitor } from '@entrio/types';

/**
 * In-memory fixtures standing in for API data until the real endpoints land.
 * Shaped exactly like the @entrio/types models so swapping in apiFetch later
 * is a drop-in change (see ./api/check-in-api.ts).
 *
 * Designed to exercise every branch of the check-in flow:
 *  - two "John Smith" records → same-name disambiguation (PRD §4.13)
 *  - one blocked visitor       → blocklist gate (PRD §4.7)
 *  - one host restriction       → host-restriction gate (PRD §4.11)
 */

const ts = '2026-01-01T00:00:00.000Z';

export const MOCK_HOSTS: User[] = [
  {
    id: 'host-1',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@nativebrands.co',
    phone: '+1 555 0110',
    role: UserRole.HOST,
    department: 'Engineering',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'host-2',
    fullName: 'Marcus Reed',
    email: 'marcus.reed@nativebrands.co',
    phone: '+1 555 0120',
    role: UserRole.HOST,
    department: 'Finance',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'host-3',
    fullName: 'Priya Patel',
    email: 'priya.patel@nativebrands.co',
    phone: '+1 555 0130',
    role: UserRole.HOST,
    department: 'Legal',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
];

const baseVisitor = {
  email: null,
  photoUrl: null,
  isBlocked: false,
  blockReason: null,
  blockedBy: null,
  blockedAt: null,
  isFlagged: false,
  flaggedBy: null,
  flaggedAt: null,
  flagNote: null,
  createdAt: ts,
} satisfies Partial<Visitor>;

export const MOCK_VISITORS: Visitor[] = [
  { ...baseVisitor, id: 'vis-1', fullName: 'John Smith', phone: '+1 555 0101' },
  { ...baseVisitor, id: 'vis-2', fullName: 'John Smith', phone: '+1 555 0199' },
  { ...baseVisitor, id: 'vis-3', fullName: 'Maria Garcia', phone: '+1 555 0123' },
  {
    ...baseVisitor,
    id: 'vis-4',
    fullName: 'Dmitri Volkov',
    phone: '+1 555 0666',
    isBlocked: true,
    blockReason: 'Prior security incident — escalate to supervisor.',
    blockedBy: 'admin-1',
    blockedAt: ts,
  },
  { ...baseVisitor, id: 'vis-5', fullName: 'Aisha Khan', phone: '+1 555 0144' },
];

/** visitorId → last completed visit timestamp, for the disambiguation list. */
export const MOCK_LAST_VISITS: Record<string, string> = {
  'vis-1': '2026-05-12T14:30:00.000Z',
  'vis-2': '2026-06-01T09:15:00.000Z',
  'vis-3': '2026-06-18T11:00:00.000Z',
  'vis-5': '2026-04-22T16:45:00.000Z',
};

/**
 * Active host-level restrictions (PRD §4.11). Aisha Khan (vis-5) may not be
 * received by Marcus Reed (host-2) — surfaces the neutral message at check-in.
 */
export const MOCK_HOST_RESTRICTIONS: Array<{ hostId: string; visitorId: string }> = [
  { hostId: 'host-2', visitorId: 'vis-5' },
];

/** Facility working hours (PRD §3 working_hours). day_of_week: 0 = Sunday. */
export const MOCK_WORKING_HOURS: Array<{
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}> = [
  { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isActive: false },
  { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 6, openTime: '00:00', closeTime: '00:00', isActive: false },
];

export const DEFAULT_VISIT_STATUS = VisitStatus.CHECKED_IN;
