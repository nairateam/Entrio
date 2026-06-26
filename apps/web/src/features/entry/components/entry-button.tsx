'use client';

import { Button, type ButtonProps } from '@/components/ui';
import { cn } from '@/lib/utils';

type EntryVariant = 'primary' | 'soft' | 'ghost';

const VARIANTS: Record<EntryVariant, string> = {
  primary:
    'bg-[#1b2a6b] text-white hover:bg-[#162257] hover:text-white shadow-lg shadow-indigo-950/25 ring-1 ring-white/10',
  soft: 'bg-white text-[#1b2a6b] hover:text-[#1b2a6b] border border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-md shadow-sm',
  ghost: 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 shadow-none',
};

/** Premium entry button — navy primary / soft card / ghost, with a subtle press. */
export function EntryButton({
  entryVariant = 'primary',
  className,
  ...props
}: ButtonProps & { entryVariant?: EntryVariant }) {
  return (
    <Button
      variant="ghost"
      {...props}
      className={cn(
        'rounded-xl font-medium transition-all duration-200 ease-out active:scale-[0.98] disabled:active:scale-100',
        VARIANTS[entryVariant],
        className,
      )}
    />
  );
}
