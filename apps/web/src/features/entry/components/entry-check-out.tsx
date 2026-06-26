'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, KeyRound, LogOut, Search, Smile } from 'lucide-react';
import { toast } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { formatTime, initials } from '@/lib/format';
import { entryApi } from '../api/entry-api';
import { useAutoReturn } from '../hooks/use-auto-return';
import { useRequireDevice } from '../hooks/use-require-device';
import type { EntryActiveVisit } from '../types';
import { EntryShell } from './entry-shell';
import { EntryButton } from './entry-button';
import { CodeField } from './code-field';
import { EntryResult } from './entry-result';

type Step = 'list' | 'code' | 'confirm' | 'done';

interface Pending {
  visitId: string;
  visitorName: string;
  hostName: string;
  checkInTime: string | null;
}

const activeKey = ['entry', 'active'] as const;

export function EntryCheckOut() {
  const { ready } = useRequireDevice();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('list');
  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);

  // The "inside now" list — fetched, kept fresh, filtered client-side.
  const { data: active = [], isLoading } = useQuery({
    queryKey: activeKey,
    queryFn: () => entryApi.listActive(),
    enabled: ready,
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (v) => v.visitorName.toLowerCase().includes(q) || v.phoneLast4.includes(q) || v.hostName.toLowerCase().includes(q),
    );
  }, [active, query]);

  const lookupCode = useMutation({
    mutationFn: () => entryApi.lookupActiveByCode(code),
    onSuccess: (v) => {
      setPending({ visitId: v.id, visitorName: v.visitorName, hostName: v.hostName, checkInTime: v.checkInTime });
      setStep('confirm');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError && e.status === 404 ? 'No active visit for that code.' : 'Lookup failed.'),
  });

  const checkOut = useMutation({
    mutationFn: () => entryApi.checkOut(pending!.visitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activeKey });
      setStep('done');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Check-out failed.'),
  });

  const returnIn = useAutoReturn(step === 'done');

  if (!ready) return null;

  const pick = (v: EntryActiveVisit) => {
    setPending({ visitId: v.visitId, visitorName: v.visitorName, hostName: v.hostName, checkInTime: v.checkInTime });
    setStep('confirm');
  };

  // --- Step: inside-now list -----------------------------------------------
  if (step === 'list') {
    return (
      <EntryShell key="list" title="Check out" subtitle="Tap your name to sign out." onBack={() => history.back()}>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your name…"
            className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-base text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-0.5">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : matches.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {active.length === 0 ? 'No one is currently checked in.' : 'No match — try a different name.'}
            </p>
          ) : (
            matches.map((v) => (
              <button
                key={v.visitId}
                onClick={() => pick(v)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
              >
                <Avatar name={v.visitorName} photoUrl={v.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{v.visitorName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Visiting {v.hostName}
                    {v.checkInTime ? ` · arrived ${formatTime(v.checkInTime)}` : ''}
                  </p>
                </div>
                <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => setStep('code')}
          className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <KeyRound className="h-4 w-4" /> Have an entry code instead?
        </button>
      </EntryShell>
    );
  }

  // --- Step: code fallback --------------------------------------------------
  if (step === 'code') {
    return (
      <EntryShell key="co-code" title="Enter your code" onBack={() => setStep('list')}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            lookupCode.mutate();
          }}
        >
          <CodeField value={code} onChange={setCode} />
          <EntryButton type="submit" size="lg" className="h-12 w-full" isLoading={lookupCode.isPending} disabled={!code.trim()}>
            Continue <ArrowRight className="h-5 w-5" />
          </EntryButton>
        </form>
      </EntryShell>
    );
  }

  // --- Step: confirm --------------------------------------------------------
  if (step === 'confirm' && pending) {
    return (
      <EntryShell key="co-confirm" title="Confirm check-out" onBack={() => setStep('list')}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            <LogOut className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 text-lg text-foreground">
            Checking out <span className="font-semibold">{pending.visitorName}</span>
            {pending.hostName ? (
              <>
                , visiting <span className="font-semibold">{pending.hostName}</span>
              </>
            ) : null}
            {pending.checkInTime ? ` — arrived ${formatTime(pending.checkInTime)}` : ''}.
          </p>
        </div>
        <EntryButton size="lg" className="mt-6 h-12 w-full" isLoading={checkOut.isPending} onClick={() => checkOut.mutate()}>
          Yes, check me out
        </EntryButton>
      </EntryShell>
    );
  }

  // --- Step: done -----------------------------------------------------------
  return (
    <EntryResult
      shellKey="co-done"
      title="Thanks for visiting!"
      returnIn={returnIn}
      icon={
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10">
          <Smile className="h-9 w-9 text-success" />
        </div>
      }
    >
      <p className="mt-2 text-base text-muted-foreground">Have a great day.</p>
    </EntryResult>
  );
}

/** Badge-photo avatar, falling back to initials. */
function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
      {initials(name)}
    </div>
  );
}
