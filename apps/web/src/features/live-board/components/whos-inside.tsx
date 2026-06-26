'use client';

import { Printer, Users } from 'lucide-react';
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
import { formatDuration, formatTime, initials } from '@/lib/format';
import type { BoardVisit } from '../types';

/**
 * Evacuation roll call (PRD §4.10) — everyone currently on site, optimized for
 * reading aloud during an incident. Printable for a paper headcount.
 */
export function WhosInside({
  visits,
  onView,
}: {
  visits: BoardVisit[];
  onView: (visit: BoardVisit) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none">{visits.length}</p>
            <p className="text-sm text-muted-foreground">
              {visits.length === 1 ? 'person' : 'people'} currently inside
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print roll call
        </Button>
      </div>

      {visits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nobody is currently checked in.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>On site</TableHead>
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
                    <span className="font-medium">{visit.visitorName}</span>
                  </button>
                </TableCell>
                <TableCell>{visit.hostName ?? 'Assigning…'}</TableCell>
                <TableCell className="text-muted-foreground">{visit.purpose ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(visit.checkInTime)}
                </TableCell>
                <TableCell className="font-medium">{formatDuration(visit.checkInTime)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
