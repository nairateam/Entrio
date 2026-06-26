import { VisitStatus } from '@entrio/types';
import type { BoardVisit, StatusFilter } from './types';

/** Ordered list for the status filter dropdown. */
export const STATUS_FILTER_OPTIONS: StatusFilter[] = [
  'all',
  VisitStatus.CHECKED_IN,
  VisitStatus.EXPECTED,
  VisitStatus.CHECKED_OUT,
  VisitStatus.NO_SHOW,
  VisitStatus.DENIED,
];

const digits = (value: string) => value.replace(/\D/g, '');

/** Visitors currently on site (PRD §4.10). */
export function insideVisits(visits: BoardVisit[]): BoardVisit[] {
  return visits.filter((v) => v.status === VisitStatus.CHECKED_IN);
}

/** Apply the text query and status filter to the board. */
export function filterVisits(
  visits: BoardVisit[],
  query: string,
  status: StatusFilter,
): BoardVisit[] {
  const q = query.trim().toLowerCase();
  const qDigits = digits(q);

  return visits.filter((v) => {
    if (status !== 'all' && v.status !== status) return false;
    if (!q) return true;
    const byName = v.visitorName.toLowerCase().includes(q);
    const byHost = (v.hostName ?? v.requestedHostName ?? '').toLowerCase().includes(q);
    const byPhone = qDigits.length >= 3 && digits(v.visitorPhone).includes(qDigits);
    return byName || byHost || byPhone;
  });
}
