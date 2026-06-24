'use client';

import { useEffect } from 'react';
import { Alert, Button } from '@/components/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for logging; a real app would forward to an error reporter.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-10">
      <Alert variant="destructive" title="Something went wrong">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
