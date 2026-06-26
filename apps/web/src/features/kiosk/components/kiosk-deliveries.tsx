'use client';

import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { useRequireDevice } from '../hooks/use-require-device';
import { KioskShell } from './kiosk-shell';
import { KioskButton } from './kiosk-button';

/**
 * Deliveries (PRD v2 — courier drop-off). Placeholder informational screen for
 * now: directs couriers to reception. A notify-reception flow can be added later.
 */
export function KioskDeliveries() {
  const { ready } = useRequireDevice();
  if (!ready) return null;

  return (
    <KioskShell key="deliveries" onBack={() => history.back()}>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-indigo-50">
          <PackageCheck className="h-9 w-9 text-[#1b2a6b]" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Deliveries</h1>
        <p className="mt-2 text-base text-slate-500">
          Please hand parcels and packages to the reception desk. A staff member will sign for
          your delivery and notify the recipient.
        </p>
        <KioskButton asChild kioskVariant="soft" size="lg" className="mt-7 w-full">
          <Link href="/kiosk">Back to start</Link>
        </KioskButton>
      </div>
    </KioskShell>
  );
}
