import { VisitStatus } from '@entrio/types';
import type { ReportVisit } from './types';

/**
 * In-memory reporting dataset, standing in for the API until the real endpoint
 * lands (see ./api/reports-api.ts). Generated deterministically across the last
 * ~10 days and business hours so the filters, summary cards, peak-hour chart and
 * breakdowns all have meaningful data.
 */

const HOSTS = [
  { id: 'host-1', name: 'Sarah Chen', department: 'Engineering' },
  { id: 'host-2', name: 'Marcus Reed', department: 'Finance' },
  { id: 'host-3', name: 'Priya Patel', department: 'Legal' },
  { id: 'host-4', name: 'Diego Santos', department: 'Sales' },
];

const PURPOSES = ['Interview', 'Vendor meeting', 'Delivery', 'Consultation', 'Onsite demo'];

// Weighted cycle: mostly completed visits, with some denied / no-show in the mix.
const STATUS_CYCLE: VisitStatus[] = [
  VisitStatus.CHECKED_OUT,
  VisitStatus.CHECKED_OUT,
  VisitStatus.CHECKED_IN,
  VisitStatus.CHECKED_OUT,
  VisitStatus.NO_SHOW,
  VisitStatus.CHECKED_OUT,
  VisitStatus.CHECKED_IN,
  VisitStatus.DENIED,
];

const now = new Date();

function isoOn(daysAgo: number, hour: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const MOCK_REPORT_VISITS: ReportVisit[] = Array.from({ length: 40 }, (_, i) => {
  const host = HOSTS[i % HOSTS.length]!;
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length]!;
  const daysAgo = i % 10;
  // Cluster arrivals around late morning to create a visible peak hour.
  const hour = [9, 10, 10, 11, 11, 13, 14, 16][i % 8]!;

  return {
    id: `rv-${i + 1}`,
    visitorName: `Visitor ${i + 1}`,
    department: host.department,
    hostId: host.id,
    hostName: host.name,
    purpose: PURPOSES[i % PURPOSES.length]!,
    status,
    occurredAt: isoOn(daysAgo, hour),
    isOverride: i % 11 === 0,
    isOverstay: status === VisitStatus.CHECKED_IN && i % 7 === 0,
  };
});

export const REPORT_DEPARTMENTS = Array.from(new Set(HOSTS.map((h) => h.department)));
export const REPORT_HOSTS = HOSTS.map((h) => ({ id: h.id, name: h.name }));
