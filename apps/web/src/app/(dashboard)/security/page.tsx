'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { VisitStatus } from '@entrio/types';
import { Activity, UserPlus, Users } from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useTodayVisits } from '@/features/live-board';
import { CheckInModal, useCheckInStore } from '@/features/check-in';
import { formatTime, initials } from '@/lib/format';

export default function SecurityOverviewPage() {
  const { data: visits = [] } = useTodayVisits();

  const reset = useCheckInStore((s) => s.reset);
  const setQuery = useCheckInStore((s) => s.setQuery);
  const search = useCheckInStore((s) => s.search);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const insideCount = useMemo(
    () => visits.filter((v) => v.status === VisitStatus.CHECKED_IN).length,
    [visits],
  );

  // Top 10 expected (pre-registered) visitors for today, soonest first.
  const expected = useMemo(
    () =>
      visits
        .filter((v) => v.status === VisitStatus.EXPECTED)
        .sort((a, b) => (a.expectedTime ?? '').localeCompare(b.expectedTime ?? ''))
        .slice(0, 10),
    [visits],
  );

  const startCheckIn = () => {
    reset();
    setCheckInOpen(true);
  };

  // Quick action: jump straight into check-in pre-loaded with this visitor (by phone).
  const startCheckInFor = (phone: string) => {
    reset();
    setQuery(phone);
    setCheckInOpen(true);
    void search();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Security</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Front desk operations — check visitors in and out and keep the live board current.
          </p>
        </div>
        <Button onClick={startCheckIn}>
          <UserPlus className="h-4 w-4" />
          Check in a visitor
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
                <p className="text-sm text-muted-foreground">
                  Today’s visits, check-outs, and evacuation roll call.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Expected today ({expected.length})
        </h2>
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
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expected.map((v) => (
                <TableRow key={v.id}>
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
                  <TableCell className="text-muted-foreground">{formatTime(v.expectedTime)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => startCheckInFor(v.visitorPhone)}>
                      Check in
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </section>
  );
}
