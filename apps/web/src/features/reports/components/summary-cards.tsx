import { AlertTriangle, Ban, Clock, ShieldCheck, UserCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { ReportSummary } from '../types';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <StatCard icon={Users} label="Total visits" value={summary.totalVisits} />
      <StatCard icon={UserCheck} label="Unique visitors" value={summary.uniqueVisitors} />
      <StatCard icon={Clock} label="Peak hour" value={summary.peakHourLabel} />
      <StatCard icon={AlertTriangle} label="Overstay incidents" value={summary.overstayIncidents} />
      <StatCard icon={ShieldCheck} label="Override events" value={summary.overrideEvents} />
      <StatCard icon={Ban} label="Denied / blocked" value={summary.deniedOrBlocked} />
    </div>
  );
}
