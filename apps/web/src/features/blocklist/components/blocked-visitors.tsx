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

export function BlockedVisitors() {
  const blocked = useBlocklistStore((s) => s.blocked);
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

      {isLoading && blocked.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : blocked.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No visitors are currently blocked.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Blocked by</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocked.map((visitor) => (
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
                <TableCell className="max-w-xs text-muted-foreground">
                  {visitor.blockReason}
                </TableCell>
                <TableCell>{visitor.blockedByName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(visitor.blockedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestAction('unblock', visitor)}
                  >
                    Remove block
                  </Button>
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
