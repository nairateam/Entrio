'use client';

import { useQuery } from '@tanstack/react-query';
import type { VisitStatus } from '@entrio/types';
import { Clock, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Avatar, Drawer, Spinner } from '@/components/ui';
import { VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { apiFetch } from '@/lib/api/client';
import { formatDateTime, formatDuration, formatTime, initials } from '@/lib/format';

export interface VisitDetail {
  id: string;
  visitorId: string | null;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string | null;
  hostName: string;
  purpose: string | null;
  status: VisitStatus;
  entryCode: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  photoUrl: string | null;
  signatureUrl: string | null;
  consentAcceptedAt: string | null;
  consentVersion: string | null;
  autoCheckedOut: boolean;
  hostResponse: string | null;
}

/** Read-only detail panel for one visit — photo, signature, consent, timings. */
export function VisitDetailDrawer({ visitId, onClose }: { visitId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['visit-detail', visitId],
    queryFn: () => apiFetch<VisitDetail>(`/api/visits/${visitId}`),
    enabled: Boolean(visitId),
  });

  return (
    <Drawer open={Boolean(visitId)} onClose={onClose} title="Visit details">
      {isLoading || !data ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6 p-5">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <Avatar src={data.photoUrl} fallback={initials(data.visitorName)} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{data.visitorName}</p>
              <div className="mt-1 flex items-center gap-2">
                <VisitStatusBadge status={data.status} />
                {data.autoCheckedOut && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    auto-closed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Photo */}
          {data.photoUrl && (
            <div>
              <SectionLabel>Photo</SectionLabel>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photoUrl}
                alt={`${data.visitorName} headshot`}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
              />
            </div>
          )}

          {/* Signature */}
          <div>
            <SectionLabel>Signature</SectionLabel>
            {data.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.signatureUrl}
                alt="Visitor signature"
                className="h-32 w-full rounded-xl border border-border bg-muted/40 object-contain p-2 dark:invert"
              />
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No signature on file.
              </p>
            )}
          </div>

          {/* Details */}
          <dl className="space-y-3 text-sm">
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={data.visitorPhone || '—'} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={data.visitorEmail || '—'} />
            <Row label="Host" value={data.hostName} />
            <Row label="Purpose" value={data.purpose || '—'} />
            {data.entryCode && <Row label="Entry code" value={data.entryCode} mono />}
            <Row
              icon={<Clock className="h-4 w-4" />}
              label="Check-in"
              value={data.checkInTime ? formatDateTime(data.checkInTime) : '—'}
            />
            <Row
              label="Check-out"
              value={data.checkOutTime ? formatDateTime(data.checkOutTime) : '—'}
            />
            {data.expectedTime && (
              <Row label="Expected" value={formatDateTime(data.expectedTime)} />
            )}
            {data.checkInTime && (
              <Row
                label="Duration"
                value={
                  data.checkOutTime
                    ? formatDuration(data.checkInTime, data.checkOutTime)
                    : formatDuration(data.checkInTime)
                }
              />
            )}
            {data.consentAcceptedAt && (
              <Row
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Consent"
                value={`Agreed ${formatTime(data.consentAcceptedAt)}${data.consentVersion ? ` · v${data.consentVersion}` : ''}`}
              />
            )}
          </dl>

          {data.hostResponse && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Host reply</p>
              <p className="mt-1 text-foreground">“{data.hostResponse}”</p>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>;
}

function Row({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className={`truncate text-right font-medium ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</dd>
    </div>
  );
}
