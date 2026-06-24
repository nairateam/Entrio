'use client';

import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Textarea,
} from '@/components/ui';
import { useBlockVisitor, useClearFlag, useUnblockVisitor } from '../hooks/use-blocklist';
import { useBlocklistUiStore } from '../store/use-blocklist-ui-store';

export function ActionModal() {
  const pending = useBlocklistUiStore((s) => s.pending);
  const reason = useBlocklistUiStore((s) => s.reason);
  const setReason = useBlocklistUiStore((s) => s.setReason);
  const cancel = useBlocklistUiStore((s) => s.cancelAction);

  const block = useBlockVisitor();
  const unblock = useUnblockVisitor();
  const clearFlag = useClearFlag();
  const isSubmitting = block.isPending || unblock.isPending || clearFlag.isPending;

  if (!pending) return null;
  const { action, visitor } = pending;

  const confirm = () => {
    const onSuccess = () => cancel();
    if (action === 'block') block.mutate({ id: visitor.id, reason }, { onSuccess });
    else if (action === 'unblock') unblock.mutate(visitor.id, { onSuccess });
    else clearFlag.mutate(visitor.id, { onSuccess });
  };

  const config = {
    block: {
      title: `Block ${visitor.fullName}?`,
      confirmLabel: 'Block visitor',
      confirmDisabled: !reason.trim(),
    },
    unblock: {
      title: `Remove block on ${visitor.fullName}?`,
      confirmLabel: 'Remove block',
      confirmDisabled: false,
    },
    'clear-flag': {
      title: `Clear flag on ${visitor.fullName}?`,
      confirmLabel: 'Clear flag',
      confirmDisabled: false,
    },
  }[action];

  return (
    <Modal open onClose={cancel} size="md" ariaLabel={config.title}>
      <ModalHeader>
        <ModalTitle>{config.title}</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-3">
        {action === 'block' && (
          <>
            <Alert variant="warning">
              A block is a building-wide, permanent denial of entry. It’s recorded against your name
              and written to the audit log.
            </Alert>
            <div className="space-y-1.5">
              <Label htmlFor="block-reason" required>
                Reason
              </Label>
              <Textarea
                id="block-reason"
                placeholder="Why is this visitor being blocked?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </>
        )}

        {action === 'unblock' && (
          <p className="text-sm text-muted-foreground">
            This lifts the building-wide block. {visitor.fullName} will be able to check in again.
            {visitor.blockReason ? ` Original reason: “${visitor.blockReason}”.` : ''}
          </p>
        )}

        {action === 'clear-flag' && (
          <p className="text-sm text-muted-foreground">
            This resolves the review flag without blocking the visitor.
            {visitor.flagNote ? ` Flag note: “${visitor.flagNote}”.` : ''}
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={cancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant={action === 'block' ? 'destructive' : 'primary'}
          onClick={confirm}
          isLoading={isSubmitting}
          disabled={config.confirmDisabled}
        >
          {config.confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
