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
import { useBlockedVisitors } from '../hooks/use-blocklist';
import { useBlocklistUiStore } from '../store/use-blocklist-ui-store';
import type { AdminVisitor } from '../types';
import { ActionModal } from './action-modal';

export function BlockedVisitors() {
  const [state, setState] = useState<TableState>(() => initialTableState());
  const requestAction = useBlocklistUiStore((s) => s.requestAction);

  const { data, isLoading, isFetching, isError } = useBlockedVisitors({
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
      id: 'reason',
      header: 'Reason',
      className: 'max-w-xs text-muted-foreground',
      cell: (v) => v.blockReason,
    },
    { id: 'blockedBy', header: 'Blocked by', cell: (v) => v.blockedByName ?? '—' },
    {
      id: 'blockedAt',
      header: 'Blocked',
      className: 'text-muted-foreground',
      cell: (v) => formatDate(v.blockedAt),
    },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      cell: (v) => (
        <Button variant="outline" size="sm" onClick={() => requestAction('unblock', v)}>
          Remove block
        </Button>
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
        errorText="Could not load the blocklist."
        emptyText="No visitors are currently blocked."
        search={{ placeholder: 'Search name or phone…' }}
      />
      <ActionModal />
    </>
  );
}
