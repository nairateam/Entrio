'use client';

import { useState } from 'react';
import { VisitStatus } from '@entrio/types';
import { Navigation } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';
import { VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { formatDateTime, formatTime, initials } from '@/lib/format';
import type { HostVisit } from '../types';
import { VisitDetailModal } from './visit-detail-modal';

export function VisitCard({ visit }: { visit: HostVisit }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const timeLine =
    visit.status === VisitStatus.EXPECTED
      ? `Expected ${formatDateTime(visit.expectedTime)}`
      : visit.checkInTime
        ? `Checked in ${formatTime(visit.checkInTime)}`
        : null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
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

        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDetailOpen(true);
          }}
        >
          Take Action
        </Button>
      </div>

      <VisitDetailModal visit={visit} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
