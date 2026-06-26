'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, X } from 'lucide-react';
import { entryApi } from '../api/entry-api';
import type { EntryHost } from '../types';

/**
 * Host typeahead (PRD v2 §3 Step 4) — a single full-width field with an inline
 * search icon. The active-host directory is fetched ONCE and cached, then
 * filtered client-side as the visitor types (instant, no per-keystroke calls).
 */
export function HostCombobox({
  value,
  onChange,
}: {
  value: EntryHost | null;
  onChange: (host: EntryHost | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: directory = [], isLoading } = useQuery({
    queryKey: ['entry', 'hosts'],
    queryFn: () => entryApi.listHosts(),
    staleTime: 5 * 60 * 1000,
  });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (h) => h.fullName.toLowerCase().includes(q) || h.department?.toLowerCase().includes(q),
    );
  }, [directory, query]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Selected state — a compact chip with a clear button.
  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3">
        <span className="text-sm text-slate-700">
          <span className="font-semibold">{value.fullName}</span>
          {value.department ? ` · ${value.department}` : ''}
        </span>
        <button
          onClick={() => {
            onChange(null);
            setQuery('');
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1b2a6b] hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing a host's name…"
        className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-base text-slate-900 outline-none transition focus:border-[#1b2a6b] focus:ring-2 focus:ring-[#1b2a6b]/15 placeholder:text-slate-400"
        autoComplete="off"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-300" />
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-slide-up-fade">
          <ul className="max-h-64 overflow-y-auto py-1">
            {matches.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400">
                {isLoading ? 'Loading hosts…' : query.trim() ? 'No hosts found.' : 'No hosts available.'}
              </li>
            ) : (
              matches.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      onChange(h);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-indigo-50/60"
                  >
                    <span className="text-sm font-medium text-slate-800">{h.fullName}</span>
                    {h.department && <span className="shrink-0 text-xs text-slate-400">{h.department}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
