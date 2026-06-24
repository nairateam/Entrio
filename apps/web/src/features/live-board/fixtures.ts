import { VisitStatus } from '@entrio/types';
import type { BoardVisit } from './types';

/**
 * In-memory fixtures for today's board, standing in for the API until the real
 * endpoint lands (see ./api/live-board-api.ts). Timestamps are anchored to the
 * current time so durations on the "Who's Inside Now" roll call look live.
 *
 * Covers every VisitStatus so the table, filters and status badges all render.
 */

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();
const minutesAhead = (mins: number) => new Date(now + mins * 60_000).toISOString();

export const MOCK_BOARD_VISITS: BoardVisit[] = [
  {
    id: 'visit-1',
    visitorName: 'Maria Garcia',
    visitorPhone: '+1 555 0123',
    photoUrl: null,
    hostName: 'Sarah Chen',
    purpose: 'Interview',
    status: VisitStatus.CHECKED_IN,
    checkInTime: minutesAgo(95),
    checkOutTime: null,
    expectedTime: minutesAgo(110),
    badgeCode: 'ENT-4F2A1C',
  },
  {
    id: 'visit-2',
    visitorName: 'John Smith',
    visitorPhone: '+1 555 0101',
    photoUrl: null,
    hostName: 'Marcus Reed',
    purpose: 'Vendor meeting',
    status: VisitStatus.CHECKED_IN,
    checkInTime: minutesAgo(40),
    checkOutTime: null,
    expectedTime: minutesAgo(45),
    badgeCode: 'ENT-9B3D7E',
  },
  {
    id: 'visit-3',
    visitorName: 'Liang Wei',
    visitorPhone: '+1 555 0177',
    photoUrl: null,
    hostName: 'Priya Patel',
    purpose: 'Contract signing',
    status: VisitStatus.CHECKED_IN,
    checkInTime: minutesAgo(255),
    checkOutTime: null,
    expectedTime: minutesAgo(260),
    badgeCode: 'ENT-1A8C2F',
  },
  {
    id: 'visit-4',
    visitorName: 'Emma Thompson',
    visitorPhone: '+1 555 0188',
    photoUrl: null,
    hostName: 'Sarah Chen',
    purpose: 'Delivery',
    status: VisitStatus.CHECKED_OUT,
    checkInTime: minutesAgo(200),
    checkOutTime: minutesAgo(150),
    expectedTime: minutesAgo(210),
    badgeCode: 'ENT-7E5B9D',
  },
  {
    id: 'visit-5',
    visitorName: 'Carlos Mendez',
    visitorPhone: '+1 555 0166',
    photoUrl: null,
    hostName: 'Priya Patel',
    purpose: 'Lunch meeting',
    status: VisitStatus.EXPECTED,
    checkInTime: null,
    checkOutTime: null,
    expectedTime: minutesAhead(75),
    badgeCode: null,
  },
  {
    id: 'visit-6',
    visitorName: 'Aisha Khan',
    visitorPhone: '+1 555 0144',
    photoUrl: null,
    hostName: 'Marcus Reed',
    purpose: 'Consultation',
    status: VisitStatus.NO_SHOW,
    checkInTime: null,
    checkOutTime: null,
    expectedTime: minutesAgo(180),
    badgeCode: null,
  },
  {
    id: 'visit-7',
    visitorName: 'Dmitri Volkov',
    visitorPhone: '+1 555 0666',
    photoUrl: null,
    hostName: 'Sarah Chen',
    purpose: 'Walk-in',
    status: VisitStatus.DENIED,
    checkInTime: null,
    checkOutTime: null,
    expectedTime: null,
    badgeCode: null,
  },
];
