'use client';

import { useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ROLE_LABELS } from '@/config/navigation';
import { initials } from '@/lib/format';
import { useUsersStore } from '../store/use-users-store';
import { InviteUserModal } from './invite-user-modal';

export function UsersTable() {
  const users = useUsersStore((s) => s.users);
  const isLoading = useUsersStore((s) => s.isLoading);
  const error = useUsersStore((s) => s.error);
  const togglingId = useUsersStore((s) => s.togglingId);
  const load = useUsersStore((s) => s.load);
  const toggleActive = useUsersStore((s) => s.toggleActive);
  const openInvite = useUsersStore((s) => s.openInvite);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openInvite}>
          <UserPlus className="h-4 w-4" />
          Invite user
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar fallback={initials(user.fullName)} size="sm" />
                    <span className="font-medium">{user.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.department ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Switch
                      checked={user.isActive}
                      disabled={togglingId === user.id}
                      onCheckedChange={(checked) => void toggleActive(user.id, checked)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <InviteUserModal />
    </div>
  );
}
