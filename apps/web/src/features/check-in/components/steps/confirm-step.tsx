'use client';

import { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Avatar, Badge, Button, Input, Label, Select } from '@/components/ui';
import { useCheckInStore } from '../../store/use-check-in-store';
import { initials, last4 } from '@/lib/format';

export function ConfirmStep() {
  const isNewVisitor = useCheckInStore((s) => s.isNewVisitor);
  const selectedVisitor = useCheckInStore((s) => s.selectedVisitor);
  const draft = useCheckInStore((s) => s.draft);
  const setDraft = useCheckInStore((s) => s.setDraft);
  const hosts = useCheckInStore((s) => s.hosts);
  const hostId = useCheckInStore((s) => s.hostId);
  const purpose = useCheckInStore((s) => s.purpose);
  const setHostId = useCheckInStore((s) => s.setHostId);
  const setPurpose = useCheckInStore((s) => s.setPurpose);
  const loadHosts = useCheckInStore((s) => s.loadHosts);
  const confirmVisitor = useCheckInStore((s) => s.confirmVisitor);
  const isSavingVisitor = useCheckInStore((s) => s.isSavingVisitor);
  const goTo = useCheckInStore((s) => s.goTo);

  useEffect(() => {
    void loadHosts();
  }, [loadHosts]);

  const visitorReady = isNewVisitor
    ? draft.fullName.trim().length > 0 && draft.phone.trim().length >= 4
    : Boolean(selectedVisitor);
  const canContinue = visitorReady && Boolean(hostId);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) void confirmVisitor();
      }}
    >
      {isNewVisitor ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">New visitor</p>
          <div className="space-y-1.5">
            <Label htmlFor="new-name" required>
              Full name
            </Label>
            <Input
              id="new-name"
              value={draft.fullName}
              onChange={(e) => setDraft({ fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-phone" required>
                Phone
              </Label>
              <Input
                id="new-phone"
                value={draft.phone}
                onChange={(e) => setDraft({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={draft.email ?? ''}
                onChange={(e) => setDraft({ email: e.target.value || null })}
              />
            </div>
          </div>
        </div>
      ) : (
        selectedVisitor && (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Avatar src={selectedVisitor.photoUrl} fallback={initials(selectedVisitor.fullName)} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{selectedVisitor.fullName}</p>
              <p className="text-sm text-muted-foreground">
                Confirm phone ending ••{last4(selectedVisitor.phone)}
              </p>
            </div>
            {selectedVisitor.isFlagged && <Badge variant="warning">Flagged</Badge>}
          </div>
        )
      )}

      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-sm font-medium">Visit details</p>
        <div className="space-y-1.5">
          <Label htmlFor="host" required>
            Host
          </Label>
          <Select id="host" value={hostId ?? ''} onChange={(e) => setHostId(e.target.value)}>
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
        <div className="space-y-1.5">
          <Label htmlFor="purpose">Purpose of visit</Label>
          <Input
            id="purpose"
            placeholder="e.g. Interview, delivery, meeting"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => goTo('search')}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" isLoading={isSavingVisitor} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </form>
  );
}
