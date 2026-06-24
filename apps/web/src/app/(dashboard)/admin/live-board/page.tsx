import { LiveBoard } from '@/features/live-board';

export default function AdminLiveBoardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Live Board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who’s on site right now, today’s visits, and the evacuation roll call.
        </p>
      </div>
      <LiveBoard />
    </section>
  );
}
