import { SettingsForm } from '@/features/settings';

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System-wide configuration. Changes apply to everyone.
        </p>
      </div>
      <SettingsForm />
    </section>
  );
}
