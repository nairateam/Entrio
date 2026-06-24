/** App-wide formatting helpers. Pure, presentation-only — no feature logic. */

/** Initials for an Avatar fallback, e.g. "Maria Garcia" → "MG". */
export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Last 4 digits of a phone number, e.g. for disambiguation (PRD §4.13). */
export function last4(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4) || '????';
}

/** Human-friendly date (e.g. "12 May 2026"); "—" for null. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Human-friendly date + time. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Time of day, e.g. "2:45 PM"; "—" for null. */
export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Human duration between two instants (or to now if no end), e.g. "1h 35m".
 */
export function formatDuration(start: string | null, end: string | null = null): string {
  if (!start) return '—';
  const from = new Date(start).getTime();
  const to = end ? new Date(end).getTime() : Date.now();
  const totalMins = Math.max(0, Math.round((to - from) / 60_000));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}
