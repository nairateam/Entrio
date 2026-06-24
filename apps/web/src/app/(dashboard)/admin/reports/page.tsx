import { ReportsDashboard } from '@/features/reports';

export default function ReportsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitor activity over a date range, with filters and CSV export.
        </p>
      </div>
      <ReportsDashboard />
    </section>
  );
}
