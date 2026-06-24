import { PreRegisterForm } from '@/features/hosts';

export default function PreRegisterPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pre-register a visitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a visitor ahead of time so they appear as “Expected” on Security’s board.
        </p>
      </div>
      <PreRegisterForm />
    </section>
  );
}
