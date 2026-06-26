'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bell, Globe, Settings } from 'lucide-react';

/**
 * Full-screen entry chrome: top bar (brand + status icons), a premium light
 * gradient stage, and a footer. Deliberately uses an explicit light palette so
 * it stays bright regardless of the app's theme.
 */
export function EntryChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      {/* Ambient gradient stage */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50/50 to-slate-100" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl" />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight text-[#1b2a6b]">
          Entrio
        </Link>
        <div className="flex items-center gap-2">
          {[Bell, Settings, Globe].map((Icon, i) => (
            <span
              key={i}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/70 text-slate-500 shadow-sm ring-1 ring-slate-200/70"
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </div>
      </header>

      {/* Stage */}
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:py-10">{children}</main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-4 text-xs text-slate-400 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="transition-colors hover:text-slate-600">Help Center</span>
          <span className="text-slate-300">•</span>
          <span className="transition-colors hover:text-slate-600">Privacy Policy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium text-emerald-600">System Online</span>
        </div>
      </footer>
    </div>
  );
}
