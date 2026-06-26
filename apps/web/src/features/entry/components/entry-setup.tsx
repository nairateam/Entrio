'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorSmartphone } from 'lucide-react';
import { Input, toast } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { entryApi } from '../api/entry-api';
import { setDeviceToken, clearDeviceToken } from '../lib/device-token';
import { EntryShell } from './entry-shell';
import { EntryButton } from './entry-button';

/**
 * One-time device pairing (PRD v2 §7). Staff pastes the token shown once in
 * Admin → Devices; we validate it against the consent endpoint, then it's ready.
 */
export function EntrySetup() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function pair() {
    if (!token.trim()) return;
    setBusy(true);
    setDeviceToken(token);
    try {
      await entryApi.consent();
      toast.success('Device paired');
      router.replace('/');
    } catch (err) {
      clearDeviceToken();
      toast.error(
        err instanceof ApiError ? 'That token was rejected. Check it and try again.' : 'Could not reach the server.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <EntryShell title="Pair this device" subtitle="Enter the device token from Admin → Devices.">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50">
          <MonitorSmartphone className="h-7 w-7 text-[#1b2a6b]" />
        </div>
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="entrio_dev_…"
          className="h-12 border-slate-200 text-center text-base"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && pair()}
        />
        <EntryButton onClick={pair} isLoading={busy} disabled={!token.trim()} size="lg" className="mt-4 h-12 w-full">
          Pair device
        </EntryButton>
      </div>
    </EntryShell>
  );
}
