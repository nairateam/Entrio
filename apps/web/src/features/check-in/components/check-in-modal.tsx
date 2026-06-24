'use client';

import { Modal } from '@/components/ui';
import { CheckInWizard } from './check-in-wizard';

/**
 * The check-in wizard in a modal. Callers own the open state and should reset the
 * store before opening (see useCheckInStore.reset) so each session starts fresh.
 */
export function CheckInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} size="xl" ariaLabel="Check in a visitor">
      <div className="p-6">
        <CheckInWizard />
      </div>
    </Modal>
  );
}
