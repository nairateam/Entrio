'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Numbered step breadcrumb + progress bar (drafts: "01 Identification › 02 …"). */
export function KioskStepper({ steps, current }: { steps: string[]; current: number }) {
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
                    ? 'bg-[#1b2a6b] text-white ring-[#1b2a6b]'
                    : active
                      ? 'bg-white text-[#1b2a6b] ring-[#1b2a6b] shadow-sm'
                      : 'bg-white text-slate-400 ring-slate-200',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:inline',
                  active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400',
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 && <span className="h-px w-4 bg-slate-200 sm:w-7" />}
            </li>
          );
        })}
      </ol>
      <div className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200/70">
        <div
          className="h-full rounded-full bg-[#1b2a6b] transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
