'use client';

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
import { useApproveOverride, useDenyOverride, useOverrides } from '../hooks/use-overrides';
import type { OverrideStatus } from '../types';

const STATUS_VARIANT: Record<OverrideStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  denied: 'destructive',
};

export function OverridesQueue() {
  const { data: requests = [], isLoading, isError } = useOverrides();
  const approve = useApproveOverride();
  const deny = useDenyOverride();

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
      {isError && <Alert variant="destructive">Could not load override requests.</Alert>}

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
                    onClick={() => deny.mutate(r.id)}
                    isLoading={deny.isPending && deny.variables === r.id}
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approve.mutate(r.id)}
                    isLoading={approve.isPending && approve.variables === r.id}
                  >
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
