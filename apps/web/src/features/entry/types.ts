/** Self-service (entry) view types — mirror the API's self-service shapes (PRD v2 §3). */

export interface ConsentPolicy {
  version: string;
  text: string;
}

/** A currently-checked-in visit, for the check-out roster (PRD v2 §3.3). Minimal
 * by design — no visit id or photo; check-out is keyed on the visitor's own code. */
export interface EntryActiveVisit {
  visitorName: string;
  phoneLast4: string;
  hostName: string;
  checkInTime: string | null;
}

/** Pre-registration confirmation from a typed code — no id/phone/photo. */
export interface PreRegLookup {
  hostName: string;
  purpose: string | null;
}

/** Active-visit confirmation from a typed code (check-out) — no id/phone/photo. */
export interface ActiveLookup {
  visitorName: string;
  hostName: string;
  checkInTime: string | null;
}

export type CheckInResult =
  | { status: 'success'; visitorName: string; hostName: string; entryCode: string }
  | { status: 'redirect' };

export interface CheckInInput {
  /** Pre-registered path: the typed code; the server resolves the expected visit. */
  entryCode?: string;
  /** Walk-in details captured this visit (no Visitor record kept). */
  newVisitor?: { fullName: string; phone: string; email?: string };
  /** Walk-in: the host the visitor typed (free text); front desk assigns the real host. */
  requestedHost?: string;
  purpose?: string;
  /** Base64 headshot + drawn signature captured at the device. */
  headshot?: string;
  signature?: string;
  consentVersion: string;
  consentAccepted: boolean;
}
