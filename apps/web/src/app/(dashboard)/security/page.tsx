'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { VisitStatus } from '@entrio/types';
import { Activity, UserPlus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useLiveBoardStore } from '@/features/live-board';

export default function SecurityOverviewPage() {
  const visits = useLiveBoardStore((s) => s.visits);
  const load = useLiveBoardStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const insideCount = useMemo(
    () => visits.filter((v) => v.status === VisitStatus.CHECKED_IN).length,
    [visits],
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Front desk operations — check visitors in and out and keep the live board current.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{insideCount} inside now</p>
            <p className="text-sm text-muted-foreground">Currently checked in</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/security/check-in" className="group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardContent className="space-y-2 p-5">
              <UserPlus className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Check in a visitor</p>
                <p className="text-sm text-muted-foreground">
                  Search or register, run security checks, capture a headshot.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/security/board" className="group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardContent className="space-y-2 p-5">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Live board</p>
                <p className="text-sm text-muted-foreground">
                  Today’s visits, check-outs, and evacuation roll call.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}
