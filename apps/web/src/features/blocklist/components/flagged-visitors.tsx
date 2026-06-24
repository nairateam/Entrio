'use client';

import { useState } from 'react';
import { Avatar, Button } from '@/components/ui';
import {
  DataTable,
  initialTableState,
  type DataTableColumn,
  type TableState,
} from '@/components/shared/data-table';
import { formatDate, initials } from '@/lib/format';
import { useFlaggedVisitors } from '../hooks/use-blocklist';
import { useBlocklistUiStore } from '../store/use-blocklist-ui-store';
import type { AdminVisitor } from '../types';
import { ActionModal } from './action-modal';

export function FlaggedVisitors() {
  const [state, setState] = useState<TableState>(() => initialTableState());
  const requestAction = useBlocklistUiStore((s) => s.requestAction);

  const { data, isLoading, isFetching, isError } = useFlaggedVisitors({
    search: state.search,
    page: state.page,
    pageSize: state.pageSize,
  });

  const columns: DataTableColumn<AdminVisitor>[] = [
    {
      id: 'visitor',
      header: 'Visitor',
      cell: (v) => (
        <div className="flex items-center gap-3">
          <Avatar src={v.photoUrl} fallback={initials(v.fullName)} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{v.fullName}</p>
            <p className="text-xs text-muted-foreground">{v.phone}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'note',
      header: 'Flag note',
      className: 'max-w-xs text-muted-foreground',
      cell: (v) => v.flagNote,
    },
    { id: 'flaggedBy', header: 'Flagged by', cell: (v) => v.flaggedByName ?? '—' },
    {
      id: 'flaggedAt',
      header: 'Flagged',
      className: 'text-muted-foreground',
      cell: (v) => formatDate(v.flaggedAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (v) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => requestAction('clear-flag', v)}>
            Clear
          </Button>
          <Button variant="destructive" size="sm" onClick={() => requestAction('block', v)}>
            Block
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
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
        errorText="Could not load flagged visitors."
        emptyText="No visitors are currently flagged for review."
        search={{ placeholder: 'Search name or phone…' }}
      />
      <ActionModal />
    </>
  );
}
