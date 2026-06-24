'use client';

import { useEffect } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatDate, initials } from '@/lib/format';
import { useBlocklistStore } from '../store/use-blocklist-store';
import { ActionModal } from './action-modal';

export function FlaggedVisitors() {
  const flagged = useBlocklistStore((s) => s.flagged);
  const isLoading = useBlocklistStore((s) => s.isLoading);
  const error = useBlocklistStore((s) => s.error);
  const load = useBlocklistStore((s) => s.load);
  const requestAction = useBlocklistStore((s) => s.requestAction);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      {isLoading && flagged.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : flagged.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No visitors are currently flagged for review.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Flag note</TableHead>
              <TableHead>Flagged by</TableHead>
              <TableHead>Flagged</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flagged.map((visitor) => (
              <TableRow key={visitor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={visitor.photoUrl} fallback={initials(visitor.fullName)} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{visitor.fullName}</p>
                      <p className="text-xs text-muted-foreground">{visitor.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs text-muted-foreground">{visitor.flagNote}</TableCell>
                <TableCell>{visitor.flaggedByName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(visitor.flaggedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestAction('clear-flag', visitor)}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => requestAction('block', visitor)}
                    >
                      Block
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ActionModal />
    </div>
  );
}
