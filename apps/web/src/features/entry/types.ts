/** Self-service (entry) view types — mirror the API's self-service shapes (PRD v2 §3). */

export interface ConsentPolicy {
  version: string;
  text: string;
}

/** A visitor match for disambiguation — never carries block/flag state. */
export interface EntryVisitorMatch {
  visitorId: string;
  fullName: string;
  phoneLast4: string;
  photoUrl: string | null;
  expectedVisitId: string | null;
  hostName: string | null;
}

export interface EntryHost {
  id: string;
  fullName: string;
  department: string | null;
}

/** A currently-checked-in visit, for the streamlined check-out list (PRD v2 §3.3). */
export interface EntryActiveVisit {
  visitId: string;
  visitorName: string;
  phoneLast4: string;
  photoUrl: string | null;
  hostName: string;
  checkInTime: string | null;
}

/** A visit looked up by entry code (pre-registered check-in, or active check-out). */
export interface EntryVisit {
  id: string;
  visitorId: string;
  visitorName: string;
  hostName: string;
  purpose: string | null;
  expectedTime: string | null;
  checkInTime: string | null;
}

export type CheckInResult =
  | { status: 'success'; visitorName: string; hostName: string; entryCode: string }
  | { status: 'redirect' };

export interface CheckInInput {
  expectedVisitId?: string;
  /** Walk-in details captured this visit (no Visitor record kept). */
  newVisitor?: { fullName: string; phone: string; email?: string };
  hostId?: string;
  purpose?: string;
  /** Base64 headshot + drawn signature captured at the device. */
  headshot?: string;
  signature?: string;
  consentVersion: string;
  consentAccepted: boolean;
}
