import { LiveBoard } from '@/features/live-board';

export default function BoardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Live Board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today’s visits at a glance — search, check visitors out, and run the evacuation roll call.
        </p>
      </div>
      <LiveBoard />
    </section>
  );
}
