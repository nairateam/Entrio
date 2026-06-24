import { VisitStatus } from '@entrio/types';
import type { HostRestriction, HostVisit } from './types';

/**
 * In-memory fixtures for the host dashboard, standing in for the API until the
 * real endpoints land (see ./api/hosts-api.ts).
 *
 * `MOCK_CURRENT_HOST` is the "logged-in host" whose visits are shown. Once auth
 * is wired this becomes the session user's id (the mock auth user is currently
 * a Security role, so the dashboard uses this fixed host instead).
 *
 * Covers upcoming (expected) and recent (checked-in / -out / no-show) visits,
 * including one arrival awaiting an "On My Way" and one already responded to.
 */
export const MOCK_CURRENT_HOST = { id: 'host-1', fullName: 'Sarah Chen' };

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();
const hoursAhead = (hours: number) => new Date(now + hours * 3_600_000).toISOString();

export const MOCK_HOST_VISITS: HostVisit[] = [
  {
    id: 'hv-1',
    hostId: 'host-1',
    visitorName: 'Maria Garcia',
    visitorPhone: '+1 555 0123',
    visitorEmail: 'maria.garcia@example.com',
    photoUrl: null,
    purpose: 'Interview',
    status: VisitStatus.CHECKED_IN,
    expectedTime: minutesAgo(20),
    checkInTime: minutesAgo(8),
    hostOnWay: false,
  },
  {
    id: 'hv-2',
    hostId: 'host-1',
    visitorName: 'Tomás Rivera',
    visitorPhone: '+1 555 0155',
    visitorEmail: null,
    photoUrl: null,
    purpose: 'Portfolio review',
    status: VisitStatus.CHECKED_IN,
    expectedTime: minutesAgo(50),
    checkInTime: minutesAgo(35),
    hostOnWay: true,
  },
  {
    id: 'hv-3',
    hostId: 'host-1',
    visitorName: 'Grace Okafor',
    visitorPhone: '+1 555 0162',
    visitorEmail: 'grace.okafor@example.com',
    photoUrl: null,
    purpose: 'Quarterly sync',
    status: VisitStatus.EXPECTED,
    expectedTime: hoursAhead(2),
    checkInTime: null,
    hostOnWay: false,
  },
  {
    id: 'hv-4',
    hostId: 'host-1',
    visitorName: 'Henrik Olsen',
    visitorPhone: '+1 555 0171',
    visitorEmail: null,
    photoUrl: null,
    purpose: 'Onsite demo',
    status: VisitStatus.EXPECTED,
    expectedTime: hoursAhead(26),
    checkInTime: null,
    hostOnWay: false,
  },
  {
    id: 'hv-5',
    hostId: 'host-1',
    visitorName: 'Emma Thompson',
    visitorPhone: '+1 555 0188',
    visitorEmail: null,
    photoUrl: null,
    purpose: 'Delivery',
    status: VisitStatus.CHECKED_OUT,
    expectedTime: minutesAgo(220),
    checkInTime: minutesAgo(200),
    hostOnWay: true,
  },
  {
    id: 'hv-6',
    hostId: 'host-1',
    visitorName: 'Carlos Mendez',
    visitorPhone: '+1 555 0166',
    visitorEmail: null,
    photoUrl: null,
    purpose: 'Lunch meeting',
    status: VisitStatus.NO_SHOW,
    expectedTime: minutesAgo(300),
    checkInTime: null,
    hostOnWay: false,
  },
];

export const MOCK_HOST_RESTRICTIONS: HostRestriction[] = [
  {
    id: 'hr-1',
    hostId: 'host-1',
    visitorName: 'Aisha Khan',
    visitorPhone: '+1 555 0144',
    reason: 'Repeatedly showed up without an appointment.',
    createdAt: '2026-05-15T10:00:00.000Z',
    isActive: true,
  },
];
