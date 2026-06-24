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
import { useLiveBoardStore } from '../store/use-live-board-store';

export function FlagModal() {
  const pending = useLiveBoardStore((s) => s.pendingFlag);
  const note = useLiveBoardStore((s) => s.flagNote);
  const setNote = useLiveBoardStore((s) => s.setFlagNote);
  const cancel = useLiveBoardStore((s) => s.cancelFlag);
  const confirm = useLiveBoardStore((s) => s.confirmFlag);
  const isFlagging = useLiveBoardStore((s) => s.isFlagging);

  if (!pending) return null;

  return (
    <Modal open onClose={cancel} size="md" ariaLabel={`Flag ${pending.visitorName}`}>
      <ModalHeader>
        <ModalTitle>Flag {pending.visitorName} for review</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-3">
        <Alert variant="info">
          Flagging escalates this visitor to a supervisor/admin for review. It does not block entry.
        </Alert>
        <div className="space-y-1.5">
          <Label htmlFor="flag-note" required>
            What’s the concern?
          </Label>
          <Textarea
            id="flag-note"
            placeholder="Describe what felt off…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={cancel} disabled={isFlagging}>
          Cancel
        </Button>
        <Button onClick={() => void confirm()} isLoading={isFlagging} disabled={!note.trim()}>
          Flag visitor
        </Button>
      </ModalFooter>
    </Modal>
  );
}
