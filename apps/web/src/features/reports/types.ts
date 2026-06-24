import type { VisitStatus } from '@entrio/types';

/** A single visit row in the reporting dataset (denormalized for aggregation). */
export interface ReportVisit {
  id: string;
  visitorName: string;
  department: string;
  hostId: string;
  hostName: string;
  purpose: string;
  status: VisitStatus;
  /** ISO timestamp of the event (check-in, or attempt for denied/no-show). */
  occurredAt: string;
  isOverride: boolean;
  isOverstay: boolean;
}

/** Admin report filters (PRD §4.9): date range + department / host / status. */
export interface ReportFilters {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  department: string; // 'all' | department
  hostId: string; // 'all' | host id
  status: VisitStatus | 'all';
}

export interface ReportSummary {
  totalVisits: number;
  uniqueVisitors: number;
  overstayIncidents: number;
  overrideEvents: number;
  deniedOrBlocked: number;
  peakHourLabel: string;
}

export interface CountBreakdown {
  label: string;
  count: number;
}

export interface HourBucket {
  hour: number;
  count: number;
}

export interface ReportData {
  summary: ReportSummary;
  byHost: CountBreakdown[];
  byDepartment: CountBreakdown[];
  peakHours: HourBucket[];
}

export interface FilterOptions {
  departments: string[];
  hosts: Array<{ id: string; name: string }>;
}
