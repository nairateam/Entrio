export type OverrideStatus = 'pending' | 'approved' | 'denied';

/** A working-hours override request awaiting admin decision (PRD §4.8). */
export interface OverrideRequest {
  id: string;
  visitorName: string;
  hostName: string;
  requestedByName: string;
  reason: string;
  requestedAt: string;
  status: OverrideStatus;
  resolvedByName: string | null;
  resolvedAt: string | null;
}
