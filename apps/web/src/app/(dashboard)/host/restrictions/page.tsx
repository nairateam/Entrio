import { RestrictionsManager } from '@/features/hosts';

export default function HostRestrictionsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Restrictions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors you don’t want sent to you. This is private to you and Admin — it isn’t a
          building-wide block, and the visitor is never told.
        </p>
      </div>
      <RestrictionsManager />
    </section>
  );
}
