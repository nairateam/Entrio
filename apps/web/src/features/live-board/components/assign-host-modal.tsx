'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from '@/components/ui';
import { useAssignHost, useHostDirectory } from '../hooks/use-live-board';
import type { BoardVisit } from '../types';

/** Front-desk picks the real host for a walk-in that checked in without one. */
export function AssignHostModal({ visit, onClose }: { visit: BoardVisit | null; onClose: () => void }) {
  const { data: hosts = [], isLoading } = useHostDirectory();
  const assign = useAssignHost();
  const [q, setQ] = useState('');

  if (!visit) return null;

  const query = q.trim().toLowerCase();
  const filtered = query
    ? hosts.filter(
        (h) => h.fullName.toLowerCase().includes(query) || h.department?.toLowerCase().includes(query),
      )
    : hosts;

  const pick = (hostId: string) =>
    assign.mutate(
      { visitId: visit.id, hostId },
      {
        onSuccess: () => {
          toast.success('Host assigned and notified.');
          onClose();
        },
        onError: () => toast.error('Could not assign the host.'),
      },
    );

  return (
    <Modal open onClose={onClose} size="md" ariaLabel={`Assign a host for ${visit.visitorName}`}>
      <ModalHeader>
        <ModalTitle>Assign a host</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {visit.visitorName} asked for{' '}
          <span className="font-medium text-foreground">{visit.requestedHostName ?? '—'}</span>. Pick the
          host to notify.
        </p>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hosts…" autoFocus />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading hosts…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No hosts found.</p>
          ) : (
            filtered.map((h) => (
              <button
                key={h.id}
                onClick={() => pick(h.id)}
                disabled={assign.isPending}
                className="flex w-full items-center justify-between rounded-md border border-border px-4 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-60"
              >
                <span className="font-medium">{h.fullName}</span>
                {h.department && <span className="text-xs text-muted-foreground">{h.department}</span>}
              </button>
            ))
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={assign.isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
