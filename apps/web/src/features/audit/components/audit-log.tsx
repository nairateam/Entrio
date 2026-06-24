'use client';

import { useState } from 'react';
import { Badge, Input, Label } from '@/components/ui';
import {
  DataTable,
  initialTableState,
  type DataTableColumn,
  type TableState,
} from '@/components/shared/data-table';
import { formatDateTime } from '@/lib/format';
import { useAuditLog } from '../hooks/use-audit';
import { ACTION_LABELS, ACTION_OPTIONS, ACTION_VARIANT } from '../utils';
import type { AuditAction, AuditEntry } from '../types';

const ACTION_FILTER_OPTIONS = ACTION_OPTIONS.map((a) => ({ value: a, label: ACTION_LABELS[a] }));

const columns: DataTableColumn<AuditEntry>[] = [
  {
    id: 'time',
    header: 'Time',
    className: 'whitespace-nowrap text-muted-foreground',
    cell: (e) => formatDateTime(e.createdAt),
  },
  { id: 'actor', header: 'Actor', className: 'font-medium', cell: (e) => e.actorName },
  {
    id: 'action',
    header: 'Action',
    cell: (e) => (
      <Badge variant={ACTION_VARIANT[e.action as AuditAction] ?? 'secondary'}>
        {ACTION_LABELS[e.action as AuditAction] ?? e.action}
      </Badge>
    ),
  },
  {
    id: 'target',
    header: 'Target',
    cell: (e) => (
      <>
        <span className="font-medium">{e.targetLabel}</span>
        <span className="ml-1 text-xs text-muted-foreground">({e.targetType})</span>
      </>
    ),
  },
  {
    id: 'detail',
    header: 'Detail',
    className: 'max-w-sm text-muted-foreground',
    cell: (e) => e.detail ?? '—',
  },
];

export function AuditLog() {
  const [state, setState] = useState<TableState>(() => initialTableState());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, isFetching, isError } = useAuditLog({
    search: state.search,
    action: state.filters.action ?? 'all',
    from,
    to,
    page: state.page,
    pageSize: state.pageSize,
  });

  const changeDate = (which: 'from' | 'to', value: string) => {
    if (which === 'from') setFrom(value);
    else setTo(value);
    setState((s) => ({ ...s, page: 1 }));
  };

  return (
    <DataTable
      rows={data?.rows ?? []}
      total={data?.total ?? 0}
      columns={columns}
      getRowKey={(e) => e.id}
      state={state}
      onStateChange={setState}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorText="Could not load the audit log."
      emptyText="No audit entries match."
      search={{ placeholder: 'Search actor, action, target…' }}
      filters={[{ id: 'action', label: 'actions', options: ACTION_FILTER_OPTIONS }]}
      toolbar={
        <>
          <div className="space-y-1.5">
            <Label htmlFor="audit-from">From</Label>
            <Input
              id="audit-from"
              type="date"
              className="w-44"
              value={from}
              max={to || undefined}
              onChange={(e) => changeDate('from', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-to">To</Label>
            <Input
              id="audit-to"
              type="date"
              className="w-44"
              value={to}
              min={from || undefined}
              onChange={(e) => changeDate('to', e.target.value)}
            />
          </div>
        </>
      }
    />
  );
}
