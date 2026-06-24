import type { ReportFilters, ReportVisit } from './types';

/** Default range: the last 10 days through today, no other filters. */
export function defaultFilters(): ReportFilters {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 10);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    department: 'all',
    hostId: 'all',
    status: 'all',
  };
}

const CSV_COLUMNS: Array<[header: string, value: (v: ReportVisit) => string]> = [
  ['Visitor', (v) => v.visitorName],
  ['Department', (v) => v.department],
  ['Host', (v) => v.hostName],
  ['Purpose', (v) => v.purpose],
  ['Status', (v) => v.status],
  ['Occurred at', (v) => v.occurredAt],
  ['Override', (v) => (v.isOverride ? 'yes' : 'no')],
  ['Overstay', (v) => (v.isOverstay ? 'yes' : 'no')],
];

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize filtered rows to CSV (PRD §4.9 export). */
export function toCsv(rows: ReportVisit[]): string {
  const header = CSV_COLUMNS.map(([h]) => h).join(',');
  const lines = rows.map((row) => CSV_COLUMNS.map(([, value]) => escapeCsv(value(row))).join(','));
  return [header, ...lines].join('\n');
}

/** Trigger a client-side CSV download. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
