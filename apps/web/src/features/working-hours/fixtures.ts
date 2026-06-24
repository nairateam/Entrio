import type { BlackoutDate, WorkingHour } from './types';

/** Mock working hours (Mon–Fri open) and a couple of blackout dates. */
export const MOCK_WORKING_HOURS: WorkingHour[] = [
  { dayOfWeek: 0, openTime: '09:00', closeTime: '17:00', isActive: false },
  { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isActive: true },
  { dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isActive: false },
];

export const MOCK_BLACKOUT_DATES: BlackoutDate[] = [
  { id: 'bo-1', date: '2026-07-04', reason: 'Independence Day' },
  { id: 'bo-2', date: '2026-12-25', reason: 'Christmas Day' },
];
