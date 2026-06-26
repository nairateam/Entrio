'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/theme-toggle';

/**
 * Full-screen entry chrome: top bar (brand + theme toggle), an ambient gradient
 * stage, and a footer. Uses theme tokens throughout, so it follows light/dark.
 */
export function EntryChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Ambient gradient stage */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/10 to-muted" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Entrio
        </Link>
        <ThemeToggle />
      </header>

      {/* Stage */}
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:py-10">{children}</main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-4 text-xs text-muted-foreground sm:px-10">
        <div className="flex items-center gap-3">
          <span className="transition-colors hover:text-foreground">Help Center</span>
          <span className="text-border">•</span>
          <span className="transition-colors hover:text-foreground">Privacy Policy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="font-medium text-success">System Online</span>
        </div>
      </footer>
    </div>
  );
}
