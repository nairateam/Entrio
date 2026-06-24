'use client';

import { useState } from 'react';
import { VisitStatus } from '@entrio/types';
import {
  DataTable,
  initialTableState,
  type DataTableColumn,
  type TableState,
} from '@/components/shared/data-table';
import { STATUS_LABELS, VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { formatDateTime } from '@/lib/format';
import { useHostVisitsPaged } from '../hooks/use-hosts';
import type { HostVisit } from '../types';

const STATUS_OPTIONS = Object.values(VisitStatus).map((s) => ({ value: s, label: STATUS_LABELS[s] }));

const columns: DataTableColumn<HostVisit>[] = [
  {
    id: 'visitor',
    header: 'Visitor',
    cell: (v) => (
      <>
        <p className="font-medium">{v.visitorName}</p>
        <p className="text-xs text-muted-foreground">{v.visitorPhone}</p>
      </>
    ),
  },
  {
    id: 'purpose',
    header: 'Purpose',
    className: 'text-muted-foreground',
    cell: (v) => v.purpose ?? '—',
  },
  { id: 'status', header: 'Status', cell: (v) => <VisitStatusBadge status={v.status} /> },
  {
    id: 'when',
    header: 'When',
    className: 'text-muted-foreground',
    cell: (v) => formatDateTime(v.checkInTime ?? v.expectedTime),
  },
];

/** The host's own visitors across all statuses — searchable + paginated. */
export function HostVisitors() {
  const [state, setState] = useState<TableState>(() => initialTableState());

  const { data, isLoading, isFetching, isError } = useHostVisitsPaged({
    search: state.search,
    status: state.filters.status ?? 'all',
    page: state.page,
    pageSize: state.pageSize,
  });

  return (
    <DataTable
      rows={data?.rows ?? []}
      total={data?.total ?? 0}
      columns={columns}
      getRowKey={(v) => v.id}
      state={state}
      onStateChange={setState}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorText="Could not load your visitors."
      emptyText="No visitors found."
      search={{ placeholder: 'Search by name or phone…' }}
      filters={[{ id: 'status', label: 'statuses', options: STATUS_OPTIONS }]}
    />
  );
}
