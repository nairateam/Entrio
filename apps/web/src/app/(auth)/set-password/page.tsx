import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
import { SetPasswordForm } from '@/features/auth';

export default function SetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Suspense fallback={<Spinner size={28} />}>
        <SetPasswordForm />
      </Suspense>
    </main>
  );
}
