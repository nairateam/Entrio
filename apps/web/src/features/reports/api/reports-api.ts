import { VisitStatus } from '@entrio/types';
import { MOCK_REPORT_VISITS, REPORT_DEPARTMENTS, REPORT_HOSTS } from '../fixtures';
import type {
  CountBreakdown,
  FilterOptions,
  HourBucket,
  ReportData,
  ReportFilters,
  ReportSummary,
  ReportVisit,
} from '../types';

/**
 * Reports data access layer.
 *
 * Each function is the seam where a real network call will go. Today it filters
 * and aggregates in-memory fixtures after a simulated round-trip; later the body
 * becomes a single `apiFetch<T>(...)` (the server would do the aggregation):
 *   return apiFetch<ReportData>(`/api/reports?${new URLSearchParams(...)}`);
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const HOURS_RANGE = { start: 7, end: 19 }; // business hours shown on the peak-hour chart

function applyFilters(visits: ReportVisit[], f: ReportFilters): ReportVisit[] {
  return visits.filter((v) => {
    const date = v.occurredAt.slice(0, 10);
    if (date < f.from || date > f.to) return false;
    if (f.department !== 'all' && v.department !== f.department) return false;
    if (f.hostId !== 'all' && v.hostId !== f.hostId) return false;
    if (f.status !== 'all' && v.status !== f.status) return false;
    return true;
  });
}

function tally(rows: ReportVisit[], key: (v: ReportVisit) => string): CountBreakdown[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function buildSummary(rows: ReportVisit[], peakHours: HourBucket[]): ReportSummary {
  const peak = peakHours.reduce<HourBucket | null>(
    (best, b) => (best && best.count >= b.count ? best : b),
    null,
  );
  const peakHourLabel =
    peak && peak.count > 0
      ? `${String(peak.hour).padStart(2, '0')}:00–${String(peak.hour + 1).padStart(2, '0')}:00`
      : '—';

  return {
    totalVisits: rows.length,
    uniqueVisitors: new Set(rows.map((r) => r.visitorName)).size,
    overstayIncidents: rows.filter((r) => r.isOverstay).length,
    overrideEvents: rows.filter((r) => r.isOverride).length,
    deniedOrBlocked: rows.filter((r) => r.status === VisitStatus.DENIED).length,
    peakHourLabel,
  };
}

function buildPeakHours(rows: ReportVisit[]): HourBucket[] {
  const buckets: HourBucket[] = [];
  for (let hour = HOURS_RANGE.start; hour <= HOURS_RANGE.end; hour++) {
    buckets.push({ hour, count: 0 });
  }
  for (const row of rows) {
    const hour = new Date(row.occurredAt).getHours();
    const bucket = buckets.find((b) => b.hour === hour);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

/** Filtered visits + aggregated report data (PRD §4.9). */
export async function getReport(
  filters: ReportFilters,
): Promise<{ data: ReportData; rows: ReportVisit[] }> {
  await wait();
  const rows = applyFilters(MOCK_REPORT_VISITS, filters);
  const peakHours = buildPeakHours(rows);
  const data: ReportData = {
    summary: buildSummary(rows, peakHours),
    byHost: tally(rows, (v) => v.hostName),
    byDepartment: tally(rows, (v) => v.department),
    peakHours,
  };
  return { data, rows };
}

/** Options for the filter dropdowns. */
export async function getFilterOptions(): Promise<FilterOptions> {
  await wait(120);
  return { departments: REPORT_DEPARTMENTS, hosts: REPORT_HOSTS };
}
