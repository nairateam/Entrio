'use client';

import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

/** The big, centered 4-digit numeric entry-code input (shared by check-in/out). */
export function CodeField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      placeholder="0000"
      inputMode="numeric"
      maxLength={4}
      autoFocus
      className={cn('h-16 border-border text-center text-4xl font-semibold tracking-[0.4em]', className)}
    />
  );
}
