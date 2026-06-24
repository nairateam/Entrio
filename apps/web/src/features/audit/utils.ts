import type { BadgeVariant } from '@/components/ui';
import type { AuditAction, AuditFilters } from './types';

export const ACTION_LABELS: Record<AuditAction, string> = {
  'visitor.checked_in': 'Checked in',
  'visitor.checked_out': 'Checked out',
  'visitor.flagged': 'Flagged',
  'visitor.flag_cleared': 'Flag cleared',
  'visitor.blocked': 'Blocked',
  'visitor.unblocked': 'Unblocked',
  'visit.denied': 'Denied',
  'override.requested': 'Override requested',
  'override.approved': 'Override approved',
};

export const ACTION_VARIANT: Record<AuditAction, BadgeVariant> = {
  'visitor.checked_in': 'success',
  'visitor.checked_out': 'secondary',
  'visitor.flagged': 'warning',
  'visitor.flag_cleared': 'outline',
  'visitor.blocked': 'destructive',
  'visitor.unblocked': 'outline',
  'visit.denied': 'destructive',
  'override.requested': 'warning',
  'override.approved': 'success',
};

export const ACTION_OPTIONS = Object.keys(ACTION_LABELS) as AuditAction[];

export function emptyFilters(): AuditFilters {
  return { search: '', action: 'all', from: '', to: '' };
}
