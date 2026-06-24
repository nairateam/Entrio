'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { formatDateTime } from '@/lib/format';
import { MOCK_CURRENT_HOST } from '../api/hosts-api';
import { useHostStore } from '../store/use-host-store';

/** Full list of the host's visitors across all statuses, searchable. */
export function HostVisitors() {
  const visits = useHostStore((s) => s.visits);
  const isLoading = useHostStore((s) => s.isLoading);
  const error = useHostStore((s) => s.error);
  const load = useHostStore((s) => s.load);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void load(MOCK_CURRENT_HOST.id);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visits;
    return visits.filter(
      (v) => v.visitorName.toLowerCase().includes(q) || v.visitorPhone.includes(q),
    );
  }, [visits, query]);

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Input
        className="max-w-xs"
        placeholder="Search by name or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && visits.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No visitors found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell>
                  <p className="font-medium">{visit.visitorName}</p>
                  <p className="text-xs text-muted-foreground">{visit.visitorPhone}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{visit.purpose ?? '—'}</TableCell>
                <TableCell>
                  <VisitStatusBadge status={visit.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(visit.checkInTime ?? visit.expectedTime)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
