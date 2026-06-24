import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-10 w-10" />
        <h1 className="text-3xl font-bold">Entrio</h1>
      </div>
      <p className="text-sm opacity-70">Visitor Management System</p>
      <Link
        href="/login"
        className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:opacity-80"
      >
        Sign in
      </Link>
    </main>
  );
}
