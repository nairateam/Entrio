/** A facility's open hours for one weekday (PRD §3 working_hours). */
export interface WorkingHour {
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isActive: boolean;
}

/** A holiday/closure that overrides working hours (PRD §3 blackout_dates). */
export interface BlackoutDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
