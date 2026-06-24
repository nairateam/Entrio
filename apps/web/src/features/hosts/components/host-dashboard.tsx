'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { Alert, Button, Spinner } from '@/components/ui';
import { MOCK_CURRENT_HOST } from '../api/hosts-api';
import { useHostStore } from '../store/use-host-store';
import { recentVisits, upcomingVisits } from '../utils';
import type { HostVisit } from '../types';
import { VisitCard } from './visit-card';

function Section({
  title,
  visits,
  emptyText,
}: {
  title: string;
  visits: HostVisit[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {title} ({visits.length})
      </h2>
      {visits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HostDashboard() {
  const visits = useHostStore((s) => s.visits);
  const isLoading = useHostStore((s) => s.isLoading);
  const error = useHostStore((s) => s.error);
  const load = useHostStore((s) => s.load);

  useEffect(() => {
    void load(MOCK_CURRENT_HOST.id);
  }, [load]);

  const upcoming = useMemo(() => upcomingVisits(visits), [visits]);
  const recent = useMemo(() => recentVisits(visits), [visits]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href="/host/pre-register">
            <CalendarPlus className="h-4 w-4" />
            Pre-register a visitor
          </Link>
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title="Upcoming"
            visits={upcoming}
            emptyText="No upcoming visitors. Pre-register one to see it here."
          />
          <Section title="Recent" visits={recent} emptyText="No recent visits yet." />
        </div>
      )}
    </div>
  );
}
