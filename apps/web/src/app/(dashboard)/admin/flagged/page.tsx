import { FlaggedVisitors } from '@/features/blocklist';

export default function FlaggedPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Flagged visitors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors raised for review. Clear the flag, or escalate to a building-wide block.
        </p>
      </div>
      <FlaggedVisitors />
    </section>
  );
}
