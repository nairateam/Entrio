import { WorkingHoursManager } from '@/features/working-hours';

export default function WorkingHoursPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Working hours</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set when the facility is open and add holiday closures. Check-ins outside these hours
          require a supervisor override.
        </p>
      </div>
      <WorkingHoursManager />
    </section>
  );
}
