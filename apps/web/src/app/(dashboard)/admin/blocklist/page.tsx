import { BlockedVisitors } from '@/features/blocklist';

export default function BlocklistPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Blocklist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors denied entry building-wide. Removing a block is recorded in the audit log.
        </p>
      </div>
      <BlockedVisitors />
    </section>
  );
}
