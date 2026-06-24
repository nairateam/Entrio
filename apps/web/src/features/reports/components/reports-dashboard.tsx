'use client';

import { useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { Alert, Button, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useReportsStore } from '../store/use-reports-store';
import { FiltersBar } from './filters-bar';
import { SummaryCards } from './summary-cards';
import { PeakHoursChart } from './peak-hours-chart';
import { BreakdownList } from './breakdown-list';

export function ReportsDashboard() {
  const data = useReportsStore((s) => s.data);
  const rows = useReportsStore((s) => s.rows);
  const isLoading = useReportsStore((s) => s.isLoading);
  const error = useReportsStore((s) => s.error);
  const init = useReportsStore((s) => s.init);
  const exportCsv = useReportsStore((s) => s.exportCsv);

  useEffect(() => {
    void init();
  }, [init]);

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

      {error && <Alert variant="destructive">{error}</Alert>}

      {!data ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <div className={cn('space-y-5 transition-opacity', isLoading && 'opacity-60')}>
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
