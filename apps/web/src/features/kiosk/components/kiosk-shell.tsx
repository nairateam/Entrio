'use client';

import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Animated content column for a kiosk screen. The page chrome (bg/top bar/footer)
 * is provided by the (kiosk) layout; this just frames a step's content with an
 * optional stepper, back affordance, and an entrance animation. `key` the parent
 * on the step name to replay the animation on each transition.
 */
export function KioskShell({
  title,
  subtitle,
  children,
  onBack,
  stepper,
  align = 'center',
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  stepper?: ReactNode;
  align?: 'center' | 'left';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <div className={cn('w-full max-w-xl animate-slide-up-fade', className)}>
      {stepper && <div className="mb-6">{stepper}</div>}

      {onBack && (
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      {(title || subtitle) && (
        <div className={cn('mb-8', centered && 'text-center')}>
          {title && (
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          )}
          {subtitle && <p className="mt-2.5 text-base text-slate-500 sm:text-lg">{subtitle}</p>}
        </div>
      )}

      {children}
    </div>
  );
}
