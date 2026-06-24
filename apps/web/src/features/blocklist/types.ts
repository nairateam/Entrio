/**
 * Visitor as seen in admin block/flag management. Denormalized from the
 * `visitors` table (PRD §3) with actor names resolved for display.
 */
export interface AdminVisitor {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;

  // Blocklist (building-wide denial — PRD §4.7 / §4.12)
  isBlocked: boolean;
  blockReason: string | null;
  blockedByName: string | null;
  blockedAt: string | null;

  // Flag (needs review, does not deny entry — PRD §4.12)
  isFlagged: boolean;
  flagNote: string | null;
  flaggedByName: string | null;
  flaggedAt: string | null;
}

export type BlocklistAction = 'block' | 'unblock' | 'clear-flag';
