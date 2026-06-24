'use client';

import { VisitStatus } from '@entrio/types';
import { Check, Navigation } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';
import { VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { formatDateTime, formatTime, initials } from '@/lib/format';
import { useHostStore } from '../store/use-host-store';
import type { HostVisit } from '../types';
import { canMarkOnWay } from '../utils';

export function VisitCard({ visit }: { visit: HostVisit }) {
  const markOnMyWay = useHostStore((s) => s.markOnMyWay);
  const markingId = useHostStore((s) => s.markingId);

  const timeLine =
    visit.status === VisitStatus.EXPECTED
      ? `Expected ${formatDateTime(visit.expectedTime)}`
      : visit.checkInTime
        ? `Checked in ${formatTime(visit.checkInTime)}`
        : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Avatar src={visit.photoUrl} fallback={initials(visit.visitorName)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{visit.visitorName}</p>
          <VisitStatusBadge status={visit.status} />
          {visit.hostOnWay && visit.status === VisitStatus.CHECKED_IN && (
            <Badge variant="success">
              <Navigation className="mr-1 h-3 w-3" />
              On the way
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {visit.purpose ?? 'No purpose given'}
          {timeLine ? ` · ${timeLine}` : ''}
        </p>
      </div>

      {canMarkOnWay(visit) && (
        <Button
          size="sm"
          onClick={() => void markOnMyWay(visit.id)}
          isLoading={markingId === visit.id}
        >
          {markingId !== visit.id && <Check className="h-4 w-4" />}
          On my way
        </Button>
      )}
    </div>
  );
}
