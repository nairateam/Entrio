/**
 * A row in the audit log viewer, denormalized from the immutable `audit_logs`
 * table (PRD §3) with the actor's name resolved for display.
 */
export interface AuditEntry {
  id: string;
  actorName: string;
  action: AuditAction;
  targetType: string;
  targetLabel: string;
  detail: string | null;
  createdAt: string;
}

/** Known audit actions. `action` is a free string in the schema; these are the
 *  values the system currently emits and the viewer knows how to label/colour. */
export type AuditAction =
  | 'visitor.checked_in'
  | 'visitor.checked_out'
  | 'visitor.flagged'
  | 'visitor.flag_cleared'
  | 'visitor.blocked'
  | 'visitor.unblocked'
  | 'visit.denied'
  | 'override.requested'
  | 'override.approved';

export type ActionFilter = AuditAction | 'all';

export interface AuditFilters {
  search: string;
  action: ActionFilter;
  from: string; // YYYY-MM-DD or ''
  to: string; // YYYY-MM-DD or ''
}
