import { AuditLog } from '@/features/audit';

export default function AuditPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable record of every state-changing action. Filter by action, actor, or date.
        </p>
      </div>
      <AuditLog />
    </section>
  );
}
