import { UsersTable } from '@/features/users';

export default function UsersPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage staff accounts, roles, and access. Deactivate to revoke access without deleting.
        </p>
      </div>
      <UsersTable />
    </section>
  );
}
