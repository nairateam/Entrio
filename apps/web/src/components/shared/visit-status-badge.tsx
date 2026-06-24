import { VisitStatus } from '@entrio/types';
import { Badge, type BadgeVariant } from '@/components/ui';

/** Display labels for each visit status. */
export const STATUS_LABELS: Record<VisitStatus, string> = {
  [VisitStatus.EXPECTED]: 'Expected',
  [VisitStatus.CHECKED_IN]: 'Checked in',
  [VisitStatus.CHECKED_OUT]: 'Checked out',
  [VisitStatus.NO_SHOW]: 'No show',
  [VisitStatus.DENIED]: 'Denied',
};

const STATUS_VARIANT: Record<VisitStatus, BadgeVariant> = {
  [VisitStatus.EXPECTED]: 'outline',
  [VisitStatus.CHECKED_IN]: 'success',
  [VisitStatus.CHECKED_OUT]: 'secondary',
  [VisitStatus.NO_SHOW]: 'warning',
  [VisitStatus.DENIED]: 'destructive',
};

/** Shared domain badge mapping a VisitStatus to a coloured Badge. */
export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
