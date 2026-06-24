'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui';
import { formatDuration, formatTime } from '@/lib/format';
import { useLiveBoardStore } from '../store/use-live-board-store';

export function CheckOutModal() {
  const pending = useLiveBoardStore((s) => s.pendingCheckout);
  const isCheckingOut = useLiveBoardStore((s) => s.isCheckingOut);
  const cancel = useLiveBoardStore((s) => s.cancelCheckout);
  const confirm = useLiveBoardStore((s) => s.confirmCheckout);

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
            <Button variant="ghost" onClick={cancel} disabled={isCheckingOut}>
              Cancel
            </Button>
            <Button onClick={() => void confirm()} isLoading={isCheckingOut}>
              Confirm check-out
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
