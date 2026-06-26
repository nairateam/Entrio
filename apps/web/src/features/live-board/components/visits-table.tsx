'use client';

import { VisitStatus } from '@entrio/types';
import { Eye, Flag, MessageSquare } from 'lucide-react';
import {
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { formatDuration, formatTime, initials } from '@/lib/format';
import type { BoardVisit } from '../types';

interface VisitsTableProps {
  visits: BoardVisit[];
  onCheckout: (visit: BoardVisit) => void;
  onFlag: (visit: BoardVisit) => void;
  onView: (visit: BoardVisit) => void;
}

export function VisitsTable({ visits, onCheckout, onFlag, onView }: VisitsTableProps) {
  if (visits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No visits match the current filters.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Visitor</TableHead>
          <TableHead>Host</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>On site</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visits.map((visit) => (
          <TableRow key={visit.id}>
            <TableCell>
              <button
                type="button"
                onClick={() => onView(visit)}
                className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
              >
                <Avatar src={visit.photoUrl} fallback={initials(visit.visitorName)} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{visit.visitorName}</p>
                  <p className="text-xs text-muted-foreground">{visit.visitorPhone}</p>
                </div>
              </button>
            </TableCell>
            <TableCell>
              <div>{visit.hostName}</div>
              {visit.hostResponse && (
                <p className="mt-1 flex items-start gap-1 text-xs font-medium text-primary">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>“{visit.hostResponse}”</span>
                </p>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">{visit.purpose ?? '—'}</TableCell>
            <TableCell>
              <VisitStatusBadge status={visit.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatTime(visit.checkInTime)}</TableCell>
            <TableCell className="text-muted-foreground">
              {visit.status === VisitStatus.CHECKED_IN
                ? formatDuration(visit.checkInTime)
                : visit.status === VisitStatus.CHECKED_OUT
                  ? formatDuration(visit.checkInTime, visit.checkOutTime)
                  : '—'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onView(visit)}>
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                {/* Walk-in self-service visits have no Visitor record to flag (PRD v2). */}
                {visit.visitorId &&
                  (visit.status === VisitStatus.CHECKED_IN ||
                    visit.status === VisitStatus.EXPECTED) && (
                    <Button variant="ghost" size="sm" onClick={() => onFlag(visit)}>
                      <Flag className="h-4 w-4" />
                      Flag
                    </Button>
                  )}
                {visit.status === VisitStatus.CHECKED_IN && (
                  <Button variant="outline" size="sm" onClick={() => onCheckout(visit)}>
                    Check out
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
