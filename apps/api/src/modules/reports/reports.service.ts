import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, VisitStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReportQueryDto } from './dto/report-query.dto';

const OVERSTAY_MS = 4 * 60 * 60 * 1000; // default 4h threshold (PRD §4.6)
const PEAK_START = 7;
const PEAK_END = 19;

export interface ReportRow {
  id: string;
  visitorName: string;
  department: string;
  hostId: string;
  hostName: string;
  purpose: string | null;
  status: VisitStatus;
  occurredAt: string;
  isOverride: boolean;
  isOverstay: boolean;
}

export interface ReportData {
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    overstayIncidents: number;
    overrideEvents: number;
    deniedOrBlocked: number;
    peakHourLabel: string;
  };
  byHost: Array<{ label: string; count: number }>;
  byDepartment: Array<{ label: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
}

const reportInclude = {
  visitor: { select: { fullName: true } },
  host: { select: { id: true, fullName: true, department: true } },
} satisfies Prisma.VisitInclude;
type VisitRow = Prisma.VisitGetPayload<{ include: typeof reportInclude }>;

interface EnrichedVisit extends ReportRow {
  visitorId: string;
  hour: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Filtered visit rows + aggregated report (PRD §4.9). */
  async getReport(filters: ReportQueryDto): Promise<{ data: ReportData; rows: ReportRow[] }> {
    const visits = await this.prisma.visit.findMany({ include: reportInclude });
    const enriched = visits.map((v) => this.enrich(v)).filter((v) => this.matches(v, filters));

    const data: ReportData = {
      summary: this.summary(enriched),
      byHost: this.tally(enriched, (v) => v.hostName),
      byDepartment: this.tally(enriched, (v) => v.department),
      peakHours: this.peakHours(enriched),
    };
    const rows = enriched.map(({ visitorId: _v, hour: _h, ...row }) => row);
    return { data, rows };
  }

  /** Options for the filter dropdowns: hosts + the admin-managed department list. */
  async getFilterOptions(): Promise<{ departments: string[]; hosts: Array<{ id: string; name: string }> }> {
    const [hosts, departmentRows] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: UserRole.host },
        select: { id: true, fullName: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.department.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    ]);
    return {
      departments: departmentRows.map((d) => d.name),
      hosts: hosts.map((h) => ({ id: h.id, name: h.fullName })),
    };
  }

  // --- helpers ---------------------------------------------------------------

  private enrich(v: VisitRow): EnrichedVisit {
    const occurred = v.checkInTime ?? v.expectedTime ?? v.createdAt;
    const isOverstay =
      v.status === VisitStatus.checked_in &&
      v.checkInTime !== null &&
      Date.now() - v.checkInTime.getTime() > OVERSTAY_MS;
    return {
      id: v.id,
      visitorId: v.visitorId ?? '',
      visitorName: v.visitor?.fullName ?? v.visitorName ?? 'Visitor',
      department: v.host.department ?? '—',
      hostId: v.host.id,
      hostName: v.host.fullName,
      purpose: v.purpose,
      status: v.status,
      occurredAt: occurred.toISOString(),
      isOverride: v.isOverride,
      isOverstay,
      hour: occurred.getHours(),
    };
  }

  private matches(v: EnrichedVisit, f: ReportQueryDto): boolean {
    const date = v.occurredAt.slice(0, 10);
    if (f.from && date < f.from) return false;
    if (f.to && date > f.to) return false;
    if (f.department && f.department !== 'all' && v.department !== f.department) return false;
    if (f.hostId && f.hostId !== 'all' && v.hostId !== f.hostId) return false;
    if (f.status && f.status !== 'all' && v.status !== f.status) return false;
    return true;
  }

  private summary(rows: EnrichedVisit[]): ReportData['summary'] {
    const peaks = this.peakHours(rows);
    const peak = peaks.reduce<{ hour: number; count: number } | null>(
      (best, b) => (best && best.count >= b.count ? best : b),
      null,
    );
    const peakHourLabel =
      peak && peak.count > 0
        ? `${String(peak.hour).padStart(2, '0')}:00–${String(peak.hour + 1).padStart(2, '0')}:00`
        : '—';

    return {
      totalVisits: rows.length,
      uniqueVisitors: new Set(rows.map((r) => r.visitorId)).size,
      overstayIncidents: rows.filter((r) => r.isOverstay).length,
      overrideEvents: rows.filter((r) => r.isOverride).length,
      deniedOrBlocked: rows.filter((r) => r.status === VisitStatus.denied).length,
      peakHourLabel,
    };
  }

  private tally(rows: EnrichedVisit[], key: (v: EnrichedVisit) => string) {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  private peakHours(rows: EnrichedVisit[]) {
    const buckets: Array<{ hour: number; count: number }> = [];
    for (let hour = PEAK_START; hour <= PEAK_END; hour++) buckets.push({ hour, count: 0 });
    for (const row of rows) {
      const bucket = buckets.find((b) => b.hour === row.hour);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }
}
