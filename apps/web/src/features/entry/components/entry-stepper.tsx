'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Numbered step breadcrumb + progress bar (drafts: "01 Identification › 02 …"). */
export function EntryStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div>
      <ol className="flex items-center justify-center gap-1.5 sm:gap-2.5">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex items-center gap-1.5 sm:gap-2.5">
              <span
                className={cn(
                  'grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ring-1 transition-all duration-300',
                  done
                    ? 'bg-primary text-primary-foreground ring-primary'
                    : active
                      ? 'bg-card text-primary ring-primary shadow-sm'
                      : 'bg-card text-muted-foreground ring-border',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:inline',
                  active ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 && <span className="h-px w-4 bg-muted sm:w-7" />}
            </li>
          );
        })}
      </ol>
      <div className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
