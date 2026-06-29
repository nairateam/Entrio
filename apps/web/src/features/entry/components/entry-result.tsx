'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { EntryButton } from './entry-button';
import { EntryShell } from './entry-shell';

/**
 * Terminal screen for the entry flows (success / redirect / done). Renders the
 * card, an optional icon, title + body, a Done link, and the auto-return countdown.
 */
export function EntryResult({
  shellKey,
  icon,
  title,
  returnIn,
  children,
}: {
  shellKey: string;
  icon?: ReactNode;
  title: string;
  returnIn: number;
  children?: ReactNode;
}) {
  return (
    <EntryShell key={shellKey}>
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {icon}
        <h1 className="mt-5 text-3xl font-bold text-foreground">{title}</h1>
        {children}
        <EntryButton asChild entryVariant="soft" size="lg" className="mt-7 w-full">
          <Link href="/">Done</Link>
        </EntryButton>
        <p className="mt-4 text-xs text-muted-foreground">Returning to start in {returnIn}s…</p>
      </div>
    </EntryShell>
  );
}
