import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-1 text-sm text-muted-foreground">This page doesn’t exist.</p>
      </div>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
