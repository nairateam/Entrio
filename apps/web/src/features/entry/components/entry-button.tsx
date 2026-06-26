'use client';

import { Button, type ButtonProps } from '@/components/ui';
import { cn } from '@/lib/utils';

type EntryVariant = 'primary' | 'soft' | 'ghost';

const VARIANTS: Record<EntryVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-lg shadow-primary/20',
  soft: 'bg-card text-foreground hover:text-foreground border border-border hover:border-primary/40 hover:bg-card hover:shadow-md shadow-sm',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent shadow-none',
};

/** Premium entry button — primary / soft card / ghost, with a subtle press. */
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
