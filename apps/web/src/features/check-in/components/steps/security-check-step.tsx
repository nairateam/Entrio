'use client';

import { Alert, Button, Label, Select } from '@/components/ui';
import { useCheckInStore } from '../../store/use-check-in-store';

export function SecurityCheckStep() {
  const security = useCheckInStore((s) => s.security);
  const hosts = useCheckInStore((s) => s.hosts);
  const hostId = useCheckInStore((s) => s.hostId);
  const setHostId = useCheckInStore((s) => s.setHostId);
  const reCheckSecurity = useCheckInStore((s) => s.reCheckSecurity);
  const isCheckingSecurity = useCheckInStore((s) => s.isCheckingSecurity);
  const goTo = useCheckInStore((s) => s.goTo);
  const reset = useCheckInStore((s) => s.reset);

  if (!security) return null;

  // Blocklist takes precedence: silent denial (PRD §4.7).
  if (security.blocked) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" title="Check-in cannot proceed">
          This visitor cannot be checked in. An admin has been notified. The attempt has been
          recorded as denied.
        </Alert>
        <p className="text-xs text-muted-foreground">
          Do not disclose the reason to the visitor. Refer them to an admin if they ask.
        </p>
        <Button variant="outline" onClick={reset}>
          Start over
        </Button>
      </div>
    );
  }

  // Host restriction: neutral message, pick another host (PRD §4.11).
  if (security.hostRestricted) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Host unavailable">
          This host is not accepting this visitor. Please select another host or contact an
          administrator.
        </Alert>
        <div className="space-y-1.5">
          <Label htmlFor="restriction-host" required>
            Choose another host
          </Label>
          <Select
            id="restriction-host"
            value={hostId ?? ''}
            onChange={(e) => setHostId(e.target.value)}
          >
            <option value="" disabled>
              Select a host…
            </option>
            {hosts.map((host) => (
              <option key={host.id} value={host.id}>
                {host.fullName} — {host.department}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => goTo('confirm')}>
            Back
          </Button>
          <Button onClick={() => void reCheckSecurity()} isLoading={isCheckingSecurity}>
            Re-check
          </Button>
        </div>
      </div>
    );
  }

  // Cleared.
  return (
    <div className="space-y-4">
      <Alert variant="success" title="Cleared">
        No blocklist or host restrictions. Proceed to capture the visitor&apos;s headshot.
      </Alert>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => goTo('confirm')}>
          Back
        </Button>
        <Button onClick={() => goTo('capture')}>Continue</Button>
      </div>
    </div>
  );
}
