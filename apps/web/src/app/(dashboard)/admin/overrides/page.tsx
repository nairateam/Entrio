import { OverridesQueue } from '@/features/overrides';

export default function OverridesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Override requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or deny after-hours check-in requests from the front desk.
        </p>
      </div>
      <OverridesQueue />
    </section>
  );
}
