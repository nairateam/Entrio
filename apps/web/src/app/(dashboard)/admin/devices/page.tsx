import { DevicesManager } from '@/features/devices';

export default function DevicesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Check-in devices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the credentials for shared self-service check-in devices (PRD v2 §2.1).
        </p>
      </div>
      <DevicesManager />
    </section>
  );
}
