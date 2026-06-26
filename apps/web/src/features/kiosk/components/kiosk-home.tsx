'use client';

import Link from 'next/link';
import { LogIn, LogOut, Package } from 'lucide-react';
import { useRequireDevice } from '../hooks/use-require-device';
import { KioskShell } from './kiosk-shell';
import { KioskButton } from './kiosk-button';

const OPTIONS = [
  { href: '/kiosk/check-in', label: 'Check in', icon: LogIn, variant: 'primary' as const },
  { href: '/kiosk/check-out', label: 'Check out', icon: LogOut, variant: 'soft' as const },
  { href: '/kiosk/deliveries', label: 'Deliveries', icon: Package, variant: 'soft' as const },
];

/** Entry screen (PRD v2 §3.1) — Check in / Check out / Deliveries. */
export function KioskHome() {
  const { ready } = useRequireDevice();
  if (!ready) return null;

  return (
    <KioskShell title="Welcome!" subtitle="Guests register here.">
      <p className="-mt-6 mb-9 text-center text-sm text-slate-400">
        Tap to check in your visit and notify your host.
      </p>

      <div className="space-y-3.5">
        {OPTIONS.map((o, i) => (
          <KioskButton
            key={o.href}
            asChild
            kioskVariant={o.variant}
            className="h-16 w-full gap-3 text-lg animate-slide-up-fade"
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <Link href={o.href}>
              <o.icon className="h-5 w-5" />
              {o.label}
            </Link>
          </KioskButton>
        ))}
      </div>
    </KioskShell>
  );
}
