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
  toast,
} from '@/components/ui';
import { useFlagVisitor } from '../hooks/use-live-board';
import { useLiveBoardUiStore } from '../store/use-live-board-ui-store';

export function FlagModal() {
  const pending = useLiveBoardUiStore((s) => s.pendingFlag);
  const note = useLiveBoardUiStore((s) => s.flagNote);
  const setNote = useLiveBoardUiStore((s) => s.setFlagNote);
  const cancel = useLiveBoardUiStore((s) => s.cancelFlag);
  const flagVisitor = useFlagVisitor();

  if (!pending) return null;

  const confirm = () => {
    flagVisitor.mutate(
      { visitorId: pending.visitorId, note: note.trim() },
      {
        onSuccess: () => {
          toast.success(`${pending.visitorName} flagged for review.`);
          cancel();
        },
        onError: () => toast.error('Could not flag the visitor.'),
      },
    );
  };

  return (
    <Modal open onClose={cancel} size="md" ariaLabel={`Flag ${pending.visitorName}`}>
      <ModalHeader>
        <ModalTitle>Flag {pending.visitorName} for review</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-3">
        <Alert variant="info">
          Flagging escalates this visitor to an admin for review. It does not block entry.
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
        <Button variant="ghost" onClick={cancel} disabled={flagVisitor.isPending}>
          Cancel
        </Button>
        <Button onClick={confirm} isLoading={flagVisitor.isPending} disabled={!note.trim()}>
          Flag visitor
        </Button>
      </ModalFooter>
    </Modal>
  );
}
