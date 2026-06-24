import { DepartmentsManager, SettingsForm } from '@/features/settings';
import { WorkingHoursManager } from '@/features/working-hours';

export default function SettingsPage() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System-wide configuration. Changes apply to everyone.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SettingsForm />
        <DepartmentsManager />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Working hours</h2>
        <p className="text-sm text-muted-foreground">
          Set when the facility is open and add holiday closures. Check-ins outside these hours
          require an admin override.
        </p>
        <WorkingHoursManager />
      </div>
    </section>
  );
}
