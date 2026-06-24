/**
 * A row in the audit log viewer, denormalized from the immutable `audit_logs`
 * table (PRD §3) with the actor's name resolved for display.
 */
export interface AuditEntry {
  id: string;
  actorName: string;
  /** Free string from the server; known values get a friendly label/colour. */
  action: string;
  targetType: string;
  targetLabel: string;
  detail: string | null;
  createdAt: string;
}

/** Actions the viewer knows how to label/colour and offer in the filter. The
 *  server may emit others, which render with their raw action string. */
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
