'use client';

import { useState } from 'react';
import { Mail, Phone, Send } from 'lucide-react';
import {
  Avatar,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Textarea,
} from '@/components/ui';
import { VisitStatusBadge } from '@/components/shared/visit-status-badge';
import { formatDateTime, formatTime, initials } from '@/lib/format';
import { VisitStatus } from '@entrio/types';
import { HOST_RESPONSES, useRespondToVisit } from '../hooks/use-hosts';
import type { HostVisit } from '../types';

export function VisitDetailModal({
  visit,
  open,
  onClose,
}: {
  visit: HostVisit;
  open: boolean;
  onClose: () => void;
}) {
  const respond = useRespondToVisit();
  const [custom, setCustom] = useState('');

  const send = (message: string) => {
    const body = message.trim();
    if (!body) return;
    respond.mutate(
      { visitId: visit.id, message: body },
      {
        onSuccess: () => {
          setCustom('');
          onClose();
        },
      },
    );
  };

  const timeLine =
    visit.status === VisitStatus.EXPECTED
      ? `Expected ${formatDateTime(visit.expectedTime)}`
      : visit.checkInTime
        ? `Checked in ${formatTime(visit.checkInTime)}`
        : null;

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel={`Visit — ${visit.visitorName}`}>
      <ModalHeader>
        <ModalTitle>Visitor details</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar src={visit.photoUrl} fallback={initials(visit.visitorName)} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-semibold">{visit.visitorName}</p>
              <VisitStatusBadge status={visit.status} />
            </div>
            {timeLine && <p className="text-sm text-muted-foreground">{timeLine}</p>}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{visit.visitorPhone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{visit.visitorEmail ?? '—'}</span>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Purpose</dt>
            <dd>{visit.purpose ?? 'No purpose given'}</dd>
          </div>
        </dl>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Respond to the front desk</p>
          <div className="flex flex-wrap gap-2">
            {HOST_RESPONSES.map((r) => (
              <Button
                key={r}
                variant="outline"
                size="sm"
                onClick={() => send(r)}
                disabled={respond.isPending}
                isLoading={respond.isPending && respond.variables?.message === r}
              >
                {r}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="custom-response">Or write your own</Label>
            <Textarea
              id="custom-response"
              placeholder="Type a message for the front desk…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={respond.isPending}>
          Close
        </Button>
        <Button
          onClick={() => send(custom)}
          disabled={!custom.trim() || respond.isPending}
          isLoading={respond.isPending && respond.variables?.message === custom.trim()}
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
      </ModalFooter>
    </Modal>
  );
}
