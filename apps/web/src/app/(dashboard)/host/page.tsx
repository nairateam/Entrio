import { HostDashboard } from '@/features/hosts';

export default function HostDashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Host</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your upcoming and recent visitors. Tap “On my way” when a visitor arrives.
        </p>
      </div>
      <HostDashboard />
    </section>
  );
}
