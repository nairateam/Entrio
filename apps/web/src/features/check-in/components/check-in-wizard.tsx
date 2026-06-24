'use client';

import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCheckInStore } from '../store/use-check-in-store';
import { STEP_LABELS, STEP_ORDER } from '../types';
import { SearchStep } from './steps/search-step';
import { DisambiguationStep } from './steps/disambiguation-step';
import { ConfirmStep } from './steps/confirm-step';
import { WorkingHoursStep } from './steps/working-hours-step';
import { SecurityCheckStep } from './steps/security-check-step';
import { CaptureStep } from './steps/capture-step';
import { ConfirmationStep } from './steps/confirmation-step';

const STEP_DESCRIPTIONS: Record<string, string> = {
  search: 'Find the visitor by name or phone, or register a new one.',
  disambiguation: 'Multiple visitors match — pick the right record.',
  confirm: 'Confirm the visitor and capture visit details.',
  'working-hours': 'Verify the facility is open for check-in.',
  'security-check': 'Blocklist and host-restriction checks.',
  capture: 'Capture the visitor’s headshot for this visit.',
  confirmation: 'Check-in complete.',
};

export function CheckInWizard() {
  const step = useCheckInStore((s) => s.step);
  const error = useCheckInStore((s) => s.error);
  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>{STEP_LABELS[step]}</CardTitle>
        <CardDescription>{STEP_DESCRIPTIONS[step]}</CardDescription>

        <ol className="flex items-center gap-1.5 pt-3" aria-label="Check-in progress">
          {STEP_ORDER.map((s, i) => (
            <li
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < currentIndex && 'bg-primary',
                i === currentIndex && 'bg-primary/60',
                i > currentIndex && 'bg-muted',
              )}
              aria-current={i === currentIndex ? 'step' : undefined}
            />
          ))}
        </ol>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        {step === 'search' && <SearchStep />}
        {step === 'disambiguation' && <DisambiguationStep />}
        {step === 'confirm' && <ConfirmStep />}
        {step === 'working-hours' && <WorkingHoursStep />}
        {step === 'security-check' && <SecurityCheckStep />}
        {step === 'capture' && <CaptureStep />}
        {step === 'confirmation' && <ConfirmationStep />}
      </CardContent>
    </Card>
  );
}
