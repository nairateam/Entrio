import { VisitStatus } from '@entrio/types';
import type { HostVisit } from './types';

/** Visits still to arrive (status expected), soonest first. */
export function upcomingVisits(visits: HostVisit[]): HostVisit[] {
  return visits
    .filter((v) => v.status === VisitStatus.EXPECTED)
    .sort((a, b) => (a.expectedTime ?? '').localeCompare(b.expectedTime ?? ''));
}

/** Visits that have happened (checked in/out or no-show), most recent first. */
export function recentVisits(visits: HostVisit[]): HostVisit[] {
  const recentStatuses: VisitStatus[] = [
    VisitStatus.CHECKED_IN,
    VisitStatus.CHECKED_OUT,
    VisitStatus.NO_SHOW,
  ];
  return visits
    .filter((v) => recentStatuses.includes(v.status))
    .sort((a, b) =>
      (b.checkInTime ?? b.expectedTime ?? '').localeCompare(a.checkInTime ?? a.expectedTime ?? ''),
    );
}

/** Whether the host can respond "On My Way" — visitor is here, not yet responded. */
export function canMarkOnWay(visit: HostVisit): boolean {
  return visit.status === VisitStatus.CHECKED_IN && !visit.hostOnWay;
}
