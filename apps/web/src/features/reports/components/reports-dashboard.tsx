'use client';

import { Download, Printer } from 'lucide-react';
import { Alert, Button, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useReport } from '../hooks/use-reports';
import { useReportsFiltersStore } from '../store/use-reports-filters-store';
import { downloadCsv, toCsv } from '../utils';
import { FiltersBar } from './filters-bar';
import { SummaryCards } from './summary-cards';
import { PeakHoursChart } from './peak-hours-chart';
import { BreakdownList } from './breakdown-list';

export function ReportsDashboard() {
  const filters = useReportsFiltersStore((s) => s.filters);
  const { data: report, isLoading, isError, isFetching } = useReport(filters);

  const rows = report?.rows ?? [];
  const data = report?.data ?? null;

  const exportCsv = () =>
    downloadCsv(`entrio-report_${filters.from}_to_${filters.to}.csv`, toCsv(rows));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
      </div>

      <FiltersBar />

      {isError && <Alert variant="destructive">Could not load report data.</Alert>}

      {!data ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <div className={cn('space-y-5 transition-opacity', (isLoading || isFetching) && 'opacity-60')}>
          <SummaryCards summary={data.summary} />
          <div className="grid gap-4 lg:grid-cols-2">
            <PeakHoursChart buckets={data.peakHours} />
            <BreakdownList title="Visits per host" items={data.byHost} />
          </div>
          <BreakdownList title="Visits per department" items={data.byDepartment} />
        </div>
      )}
    </div>
  );
}
