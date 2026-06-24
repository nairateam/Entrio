import { Visitations } from '@/features/visitations';

export default function VisitationsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Visitations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every visit on a given day — pick a date to browse the log.
        </p>
      </div>
      <Visitations />
    </section>
  );
}
