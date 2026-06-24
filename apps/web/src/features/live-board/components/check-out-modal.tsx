'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from '@/components/ui';
import { formatDuration, formatTime } from '@/lib/format';
import { useCheckOut } from '../hooks/use-live-board';
import { useLiveBoardUiStore } from '../store/use-live-board-ui-store';

export function CheckOutModal() {
  const pending = useLiveBoardUiStore((s) => s.pendingCheckout);
  const cancel = useLiveBoardUiStore((s) => s.cancelCheckout);
  const checkOut = useCheckOut();

  const confirm = () => {
    if (!pending) return;
    checkOut.mutate(pending.id, {
      onSuccess: () => {
        toast.success(`${pending.visitorName} checked out.`);
        cancel();
      },
      onError: () => toast.error('Check-out failed. Please try again.'),
    });
  };

  return (
    <Modal open={Boolean(pending)} onClose={cancel} size="sm" ariaLabel="Confirm check-out">
      {pending && (
        <>
          <ModalHeader>
            <ModalTitle>Check out {pending.visitorName}?</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-1 text-sm text-muted-foreground">
            <p>
              Host: <span className="text-foreground">{pending.hostName}</span>
            </p>
            <p>
              Checked in at{' '}
              <span className="text-foreground">{formatTime(pending.checkInTime)}</span> ·{' '}
              {formatDuration(pending.checkInTime)} on site
            </p>
            <p className="pt-2">
              This logs the check-out time and removes them from the live board.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={cancel} disabled={checkOut.isPending}>
              Cancel
            </Button>
            <Button onClick={confirm} isLoading={checkOut.isPending}>
              Confirm check-out
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
