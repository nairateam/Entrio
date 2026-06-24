'use client';

import { CheckCircle2 } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useCheckInStore } from '../../store/use-check-in-store';
import { formatDateTime } from '@/lib/format';

export function ConfirmationStep() {
  const result = useCheckInStore((s) => s.result);
  const selectedVisitor = useCheckInStore((s) => s.selectedVisitor);
  const hosts = useCheckInStore((s) => s.hosts);
  const reset = useCheckInStore((s) => s.reset);

  if (!result) return null;
  const { visit } = result;
  const host = hosts.find((h) => h.id === visit.hostId);

  return (
    <div className="space-y-5 text-center">
      <div className="flex flex-col items-center gap-2">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h3 className="text-lg font-semibold">Checked in</h3>
        <p className="text-sm text-muted-foreground">
          {selectedVisitor?.fullName} is now on the live board. The host has been notified.
        </p>
      </div>

      <dl className="mx-auto max-w-sm space-y-2 rounded-lg border border-border p-4 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Badge</dt>
          <dd className="font-mono font-medium">{visit.badgeCode}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Host</dt>
          <dd className="font-medium">{host?.fullName ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Purpose</dt>
          <dd className="font-medium">{visit.purpose ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Checked in</dt>
          <dd className="font-medium">{formatDateTime(visit.checkInTime)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <Badge variant="success">{visit.status}</Badge>
            {visit.isOverride && (
              <Badge variant="warning" className="ml-1">
                override
              </Badge>
            )}
          </dd>
        </div>
      </dl>

      <Button onClick={reset}>Check in another visitor</Button>
    </div>
  );
}
