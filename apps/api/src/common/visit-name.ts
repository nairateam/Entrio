/**
 * Display name for a visit's visitor. Prefers the linked Visitor record; falls
 * back to the denormalized walk-in name (PRD v2 snapshot model — walk-ins have
 * no Visitor row). Pass a sentence-friendly fallback (e.g. "A visitor") where
 * the name appears mid-sentence.
 */
export function visitorDisplayName(
  v: { visitor?: { fullName: string } | null; visitorName?: string | null },
  fallback = 'Visitor',
): string {
  return v.visitor?.fullName ?? v.visitorName ?? fallback;
}
