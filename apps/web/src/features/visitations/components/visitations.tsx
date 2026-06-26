'use client';

import { useState } from 'react';
import { VisitStatus } from '@entrio/types';
import { Avatar, Input, Label } from '@/components/ui';
import {
  DataTable,
  initialTableState,
  type DataTableColumn,
  type TableState,
} from '@/components/shared/data-table';
import { STATUS_LABELS, VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { VisitDetailDrawer } from '@/components/shared/visit-detail-drawer';
import { formatDuration, formatTime, initials } from '@/lib/format';
import { useVisitations } from '../hooks/use-visitations';
import type { Visitation } from '../types';

/** Today's date as YYYY-MM-DD in local time (for the date input default). */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const columns: DataTableColumn<Visitation>[] = [
  {
    id: 'visitor',
    header: 'Visitor',
    cell: (v) => (
      <div className="flex items-center gap-3">
        <Avatar src={v.photoUrl} fallback={initials(v.visitorName)} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium">{v.visitorName}</p>
          <p className="text-xs text-muted-foreground">{v.visitorPhone}</p>
        </div>
      </div>
    ),
  },
  { id: 'host', header: 'Host', cell: (v) => v.hostName },
  {
    id: 'purpose',
    header: 'Purpose',
    className: 'text-muted-foreground',
    cell: (v) => v.purpose ?? '—',
  },
  { id: 'status', header: 'Status', cell: (v) => <VisitStatusBadge status={v.status} /> },
  {
    id: 'checkIn',
    header: 'Check-in',
    className: 'text-muted-foreground',
    cell: (v) => formatTime(v.checkInTime),
  },
  {
    id: 'checkOut',
    header: 'Check-out',
    className: 'text-muted-foreground',
    cell: (v) => formatTime(v.checkOutTime),
  },
  {
    id: 'duration',
    header: 'Duration',
    className: 'text-muted-foreground',
    cell: (v) =>
      v.status === VisitStatus.CHECKED_OUT
        ? formatDuration(v.checkInTime, v.checkOutTime)
        : v.status === VisitStatus.CHECKED_IN
          ? formatDuration(v.checkInTime)
          : '—',
  },
];

const STATUS_OPTIONS = Object.values(VisitStatus).map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export function Visitations() {
  const [from, setFrom] = useState(todayLocal);
  const [to, setTo] = useState(todayLocal);
  const [state, setState] = useState<TableState>(() => initialTableState());
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError } = useVisitations({
    from,
    to,
    search: state.search,
    status: state.filters.status ?? 'all',
    page: state.page,
    pageSize: state.pageSize,
  });

  // Changing the date range resets to the first page.
  const changeFrom = (value: string) => {
    setFrom(value || todayLocal());
    setState((s) => ({ ...s, page: 1 }));
  };
  const changeTo = (value: string) => {
    setTo(value || todayLocal());
    setState((s) => ({ ...s, page: 1 }));
  };

  return (
    <>
    <DataTable
      rows={data?.rows ?? []}
      total={data?.total ?? 0}
      columns={columns}
      getRowKey={(v) => v.id}
      onRowClick={(v) => setDetailId(v.id)}
      state={state}
      onStateChange={setState}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorText="Could not load visitations."
      emptyText="No visitations in this range."
      search={{ placeholder: 'Search visitor, host, phone…' }}
      filters={[{ id: 'status', label: 'statuses', options: STATUS_OPTIONS }]}
      toolbar={
        <>
          <div className="space-y-1.5">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              className="w-44"
              value={from}
              max={to}
              onChange={(e) => changeFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              className="w-44"
              value={to}
              min={from}
              max={todayLocal()}
              onChange={(e) => changeTo(e.target.value)}
            />
          </div>
        </>
      }
    />
    <VisitDetailDrawer visitId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}
