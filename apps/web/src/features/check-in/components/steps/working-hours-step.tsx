'use client';

import { Alert, Button, Label, Textarea } from '@/components/ui';
import { useCheckInStore } from '../../store/use-check-in-store';

export function WorkingHoursStep() {
  const workingHours = useCheckInStore((s) => s.workingHours);
  const proceed = useCheckInStore((s) => s.proceedFromWorkingHours);
  const isCheckingSecurity = useCheckInStore((s) => s.isCheckingSecurity);
  const overrideReason = useCheckInStore((s) => s.overrideReason);
  const setOverrideReason = useCheckInStore((s) => s.setOverrideReason);
  const requestOverride = useCheckInStore((s) => s.requestOverride);
  const isRequestingOverride = useCheckInStore((s) => s.isRequestingOverride);
  const goTo = useCheckInStore((s) => s.goTo);

  if (!workingHours) return null;

  if (workingHours.isOpen) {
    return (
      <div className="space-y-4">
        <Alert variant="success" title="Within working hours">
          {workingHours.dayLabel}: open {workingHours.opensAt}–{workingHours.closesAt}.
        </Alert>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => goTo('confirm')}>
            Back
          </Button>
          <Button onClick={() => void proceed()} isLoading={isCheckingSecurity}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Closed → check-in blocked; security may request an override (PRD §4.8).
  return (
    <div className="space-y-4">
      <Alert variant="warning" title="Outside working hours">
        {workingHours.dayLabel}:{' '}
        {workingHours.opensAt
          ? `open ${workingHours.opensAt}–${workingHours.closesAt}`
          : 'the facility is closed'}
        . Check-in is blocked and requires an admin override.
      </Alert>

      <div className="space-y-1.5">
        <Label htmlFor="override-reason" required>
          Override reason
        </Label>
        <Textarea
          id="override-reason"
          placeholder="Why is this after-hours check-in necessary?"
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => goTo('confirm')}>
          Back
        </Button>
        <Button
          onClick={() => void requestOverride()}
          isLoading={isRequestingOverride}
          disabled={!overrideReason.trim()}
        >
          Request override
        </Button>
      </div>
    </div>
  );
}
