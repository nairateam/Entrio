import { randomInt } from 'node:crypto';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * A short 4-digit entry code (PRD v2 §3.2) — easy to read in an email and type
 * on any keypad. Uniqueness is only required among *active* visits (expected /
 * checked_in); codes are released (set null) at check-out, so the 4-digit space
 * is recycled rather than exhausted.
 */
export function generateEntryCode(): string {
  return String(randomInt(0, 10000)).padStart(4, '0');
}

/** Allocate an entry code not currently held by any visit, retrying on collision. */
export async function allocateEntryCode(prisma: PrismaService, attempts = 20): Promise<string> {
  for (let i = 0; i < attempts; i += 1) {
    const code = generateEntryCode();
    const clash = await prisma.visit.findUnique({ where: { entryCode: code }, select: { id: true } });
    if (!clash) return code;
  }
  throw new Error('Could not allocate an entry code.');
}

/** Normalize a code typed by a visitor (trim, digits only) for lookup. */
export function normalizeEntryCode(code: string): string {
  return code.trim().replace(/\D/g, '');
}
