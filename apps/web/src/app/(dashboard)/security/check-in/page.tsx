import { CheckInWizard } from '@/features/check-in';

export default function CheckInPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a visitor, run the security checks, capture a headshot, and check them in.
        </p>
      </div>
      <CheckInWizard />
    </section>
  );
}
