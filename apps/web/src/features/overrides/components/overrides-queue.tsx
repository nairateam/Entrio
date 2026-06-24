'use client';

import { useEffect } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Spinner,
  type BadgeVariant,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useOverridesStore } from '../store/use-overrides-store';
import type { OverrideStatus } from '../types';

const STATUS_VARIANT: Record<OverrideStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  denied: 'destructive',
};

export function OverridesQueue() {
  const requests = useOverridesStore((s) => s.requests);
  const isLoading = useOverridesStore((s) => s.isLoading);
  const error = useOverridesStore((s) => s.error);
  const actingId = useOverridesStore((s) => s.actingId);
  const load = useOverridesStore((s) => s.load);
  const approve = useOverridesStore((s) => s.approve);
  const deny = useOverridesStore((s) => s.deny);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = requests.filter((r) => r.status === 'pending');
  const resolved = requests.filter((r) => r.status !== 'pending');

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No override requests waiting.
          </div>
        ) : (
          pending.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {r.visitorName} <span className="text-muted-foreground">→ {r.hostName}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested by {r.requestedByName} · {formatDateTime(r.requestedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void deny(r.id)}
                    isLoading={actingId === r.id}
                  >
                    Deny
                  </Button>
                  <Button size="sm" onClick={() => void approve(r.id)} isLoading={actingId === r.id}>
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Resolved</h2>
          {resolved.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {r.visitorName} <span className="text-muted-foreground">→ {r.hostName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.resolvedByName} · {formatDateTime(r.resolvedAt)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
