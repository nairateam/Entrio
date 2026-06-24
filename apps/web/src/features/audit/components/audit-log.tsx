'use client';

import { useEffect } from 'react';
import {
  Alert,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useAuditStore } from '../store/use-audit-store';
import { ACTION_LABELS, ACTION_OPTIONS, ACTION_VARIANT } from '../utils';
import type { ActionFilter } from '../types';

export function AuditLog() {
  const entries = useAuditStore((s) => s.entries);
  const filters = useAuditStore((s) => s.filters);
  const isLoading = useAuditStore((s) => s.isLoading);
  const error = useAuditStore((s) => s.error);
  const load = useAuditStore((s) => s.load);
  const setFilter = useAuditStore((s) => s.setFilter);
  const resetFilters = useAuditStore((s) => s.resetFilters);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <Input
          className="col-span-2 md:col-span-1"
          placeholder="Search actor, target, detail…"
          value={filters.search}
          onChange={(e) => void setFilter({ search: e.target.value })}
        />
        <Select
          value={filters.action}
          onChange={(e) => void setFilter({ action: e.target.value as ActionFilter })}
        >
          <option value="all">All actions</option>
          {ACTION_OPTIONS.map((action) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action]}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          aria-label="From date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => void setFilter({ from: e.target.value })}
        />
        <Input
          type="date"
          aria-label="To date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => void setFilter({ to: e.target.value })}
        />
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {isLoading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No audit entries match the current filters.
          <Button variant="outline" size="sm" onClick={() => void resetFilters()}>
            Clear filters
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{entry.actorName}</TableCell>
                <TableCell>
                  <Badge variant={ACTION_VARIANT[entry.action]}>
                    {ACTION_LABELS[entry.action]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{entry.targetLabel}</span>
                  <span className="ml-1 text-xs text-muted-foreground">({entry.targetType})</span>
                </TableCell>
                <TableCell className="max-w-sm text-muted-foreground">{entry.detail ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
