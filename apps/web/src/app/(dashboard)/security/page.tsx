'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { VisitStatus } from '@entrio/types';
import { Activity, DoorOpen, Users } from 'lucide-react';
import {
  Avatar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { VisitDetailDrawer } from '@/components/shared/visit-detail-drawer';
import { useTodayVisits } from '@/features/live-board';
import { formatTime, initials } from '@/lib/format';

export default function SecurityOverviewPage() {
  const { data: visits = [] } = useTodayVisits();
  const [detailId, setDetailId] = useState<string | null>(null);

  const insideCount = useMemo(
    () => visits.filter((v) => v.status === VisitStatus.CHECKED_IN).length,
    [visits],
  );

  // Pre-registered visitors expected today, soonest first.
  const expected = useMemo(
    () =>
      visits
        .filter((v) => v.status === VisitStatus.EXPECTED)
        .sort((a, b) => (a.expectedTime ?? '').localeCompare(b.expectedTime ?? ''))
        .slice(0, 10),
    [visits],
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors check themselves in at the entry device. Monitor the board and step in when
          something needs a hand.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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

        <Link href="/security/board" className="group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">Live board</p>
                <p className="text-sm text-muted-foreground">Today’s visits + roll call.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <DoorOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{expected.length}</p>
              <p className="text-sm text-muted-foreground">Expected today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Expected today</h2>
        {expected.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No visitors are pre-registered for today.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Host</TableHead>
                <TableHead className="text-right">Expected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expected.map((v) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer"
                  onClick={() => setDetailId(v.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={v.photoUrl} fallback={initials(v.visitorName)} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{v.visitorName}</p>
                        <p className="text-xs text-muted-foreground">{v.visitorPhone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{v.hostName}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatTime(v.expectedTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <VisitDetailDrawer visitId={detailId} onClose={() => setDetailId(null)} />
    </section>
  );
}
