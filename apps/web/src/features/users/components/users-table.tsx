'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { UserRole, type User } from '@entrio/types';
import { Avatar, Badge, Button, Switch } from '@/components/ui';
import {
  DataTable,
  initialTableState,
  type DataTableColumn,
  type TableState,
} from '@/components/shared/data-table';
import { ROLE_LABELS } from '@/config/navigation';
import { initials } from '@/lib/format';
import { useSetUserActive, useUsers } from '../hooks/use-users';
import { InviteUserModal } from './invite-user-modal';

const ROLE_OPTIONS = Object.values(UserRole).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function UsersTable() {
  const [state, setState] = useState<TableState>(() => initialTableState());
  const [inviteOpen, setInviteOpen] = useState(false);
  const setActive = useSetUserActive();

  const { data, isLoading, isFetching, isError } = useUsers({
    search: state.search,
    role: state.filters.role ?? 'all',
    page: state.page,
    pageSize: state.pageSize,
  });

  const columns: DataTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={initials(u.fullName)} size="sm" />
          <span className="font-medium">{u.fullName}</span>
        </div>
      ),
    },
    { id: 'email', header: 'Email', className: 'text-muted-foreground', cell: (u) => u.email },
    {
      id: 'role',
      header: 'Role',
      cell: (u) => <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      id: 'department',
      header: 'Department',
      className: 'text-muted-foreground',
      cell: (u) => u.department ?? '—',
    },
    {
      id: 'active',
      header: 'Active',
      align: 'right',
      cell: (u) => (
        <div className="flex justify-end">
          <Switch
            checked={u.isActive}
            disabled={setActive.isPending && setActive.variables?.id === u.id}
            onCheckedChange={(checked) => setActive.mutate({ id: u.id, isActive: checked })}
          />
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
        getRowKey={(u) => u.id}
        state={state}
        onStateChange={setState}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorText="Could not load users."
        emptyText="No users match."
        search={{ placeholder: 'Search name or email…' }}
        filters={[{ id: 'role', label: 'roles', options: ROLE_OPTIONS }]}
        toolbar={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        }
      />
      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
