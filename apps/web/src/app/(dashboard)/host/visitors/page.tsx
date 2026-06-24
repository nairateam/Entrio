import { HostVisitors } from '@/features/hosts';

export default function HostVisitorsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My visitors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone you’ve hosted or are expecting, across all statuses.
        </p>
      </div>
      <HostVisitors />
    </section>
  );
}
