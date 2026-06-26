import type { ReactNode } from 'react';
import { KioskChrome } from '@/features/kiosk';

export default function KioskLayout({ children }: { children: ReactNode }) {
  return <KioskChrome>{children}</KioskChrome>;
}
