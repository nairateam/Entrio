import type { User, Visit, Visitor, VisitStatus } from '@entrio/types';

/**
 * Wizard steps for the Security walk-in / pre-registered check-in flow.
 * Mirrors PRD §4.1–4.2 plus the gating rules in §4.7 (blocklist), §4.8
 * (working-hours override) and §4.11 (host restriction).
 */
export type WizardStep =
  | 'search'
  | 'disambiguation'
  | 'confirm'
  | 'working-hours'
  | 'security-check'
  | 'capture'
  | 'confirmation';

export const STEP_ORDER: WizardStep[] = [
  'search',
  'disambiguation',
  'confirm',
  'working-hours',
  'security-check',
  'capture',
  'confirmation',
];

export const STEP_LABELS: Record<WizardStep, string> = {
  search: 'Search',
  disambiguation: 'Select match',
  confirm: 'Confirm details',
  'working-hours': 'Working hours',
  'security-check': 'Security check',
  capture: 'Headshot',
  confirmation: 'Done',
};

/** A pending pre-registration for this visitor — host is locked at check-in (PRD §4.2). */
export interface ExpectedVisitRef {
  id: string;
  hostId: string;
  hostName: string;
  purpose: string | null;
  expectedTime: string | null;
}

/**
 * A search hit. Per PRD §4.13 the row must show enough to disambiguate
 * same-name visitors: phone (last 4 shown in UI), last visit date, last headshot.
 */
export interface VisitorSearchResult {
  visitor: Visitor;
  lastVisitAt: string | null;
  /** Set when the visitor was pre-registered (status `expected`); host comes locked. */
  expectedVisit: ExpectedVisitRef | null;
}

/** New visitor details captured when no existing record matches (PRD §4.1.3). */
export interface NewVisitorInput {
  fullName: string;
  phone: string;
  email: string | null;
}

/** Result of the working-hours gate (PRD §4.8). */
export interface WorkingHoursStatus {
  isOpen: boolean;
  dayLabel: string;
  opensAt: string | null;
  closesAt: string | null;
}

/** Combined blocklist (§4.7) + host-restriction (§4.11) gate result. */
export interface SecurityCheckResult {
  blocked: boolean;
  blockReason: string | null;
  hostRestricted: boolean;
}

/** Payload sent to create the visit on confirmation (PRD §4.1.8). */
export interface CheckInPayload {
  visitorId: string;
  hostId: string;
  purpose: string;
  /** Captured client-side; photo upload (S3) is not wired yet, so not sent. */
  headshot: string | null;
  /** Id of an approved override request, when checking in outside hours (§4.8). */
  overrideRequestId: string | null;
  /** Id of the pending `expected` visit being fulfilled — transitions it in place (§4.2). */
  expectedVisitId: string | null;
}

/** The created visit as returned by the API (denormalized board row). */
export interface CheckedInVisit {
  id: string;
  visitorId: string;
  visitorName: string;
  hostName: string;
  purpose: string | null;
  status: VisitStatus;
  checkInTime: string | null;
}

/** Successful check-in. */
export interface CheckInResult {
  visit: CheckedInVisit;
}

export type { User, Visit, Visitor };
