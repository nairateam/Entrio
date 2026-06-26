import type { ReactNode } from 'react';
import { EntryChrome } from '@/features/entry';

export default function EntryLayout({ children }: { children: ReactNode }) {
  return <EntryChrome>{children}</EntryChrome>;
}
