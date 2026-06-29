import { UserRole } from '@entrio/types';
import { inviteSchema, type InviteInput } from './schema';

/** Expected CSV header (order-independent, case-insensitive). */
export const CSV_HEADERS = ['fullName', 'email', 'role', 'department'] as const;

export const CSV_TEMPLATE = `fullName,email,role,department
Jane Doe,jane@example.com,host,Engineering
John Smith,john@example.com,security,
Amara Okeke,amara@example.com,admin,Operations
`;

/** One parsed row: either a valid invite or an error with its source line. */
export type ParsedRow =
  | { line: number; ok: true; value: InviteInput; raw: Record<string, string> }
  | { line: number; ok: false; error: string; raw: Record<string, string> };

export interface ParseResult {
  rows: ParsedRow[];
  valid: InviteInput[];
  headerError: string | null;
}

/** Strip a leading UTF-8 BOM (0xFEFF) if the file has one. */
const stripBom = (text: string): string => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/**
 * Minimal RFC-4180-ish CSV parser — handles quoted fields, escaped quotes (""),
 * and commas/newlines inside quotes. Returns an array of string cells per record.
 */
function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  const src = stripBom(text).replace(/\r\n?/g, '\n');

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += ch;
    }
  }
  // Flush the trailing field/record (file may not end with a newline).
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

/** Map free-text role values to the enum (accepts labels like "Administrator"). */
function normalizeRole(value: string): UserRole | null {
  const v = value.trim().toLowerCase();
  if (v === UserRole.SECURITY || v.startsWith('sec')) return UserRole.SECURITY;
  if (v === UserRole.HOST) return UserRole.HOST;
  if (v === UserRole.ADMIN || v.startsWith('admin')) return UserRole.ADMIN;
  return null;
}

/**
 * Parse + validate a CSV string into invite rows. Skips fully-blank lines.
 * Every non-blank data row appears in `rows` (valid or with an error) so the UI
 * can show a per-row preview; `valid` is the subset ready to submit.
 */
export function parseUsersCsv(text: string): ParseResult {
  const records = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  const headerRow = records[0];
  if (!headerRow) {
    return { rows: [], valid: [], headerError: 'The file is empty.' };
  }

  const header = headerRow.map((h) => h.trim().toLowerCase());
  const idx = {
    fullName: header.indexOf('fullname'),
    email: header.indexOf('email'),
    role: header.indexOf('role'),
    department: header.indexOf('department'),
  };
  if (idx.fullName === -1 || idx.email === -1 || idx.role === -1) {
    return {
      rows: [],
      valid: [],
      headerError: 'Header row must include: fullName, email, role (department is optional).',
    };
  }

  const rows: ParsedRow[] = [];
  const valid: InviteInput[] = [];

  for (let r = 1; r < records.length; r += 1) {
    const cells = records[r];
    if (!cells) continue;
    const raw = {
      fullName: (cells[idx.fullName] ?? '').trim(),
      email: (cells[idx.email] ?? '').trim(),
      role: (cells[idx.role] ?? '').trim(),
      department: idx.department === -1 ? '' : (cells[idx.department] ?? '').trim(),
    };
    const line = r + 1; // 1-based, accounting for the header row

    const role = normalizeRole(raw.role);
    if (!role) {
      rows.push({ line, ok: false, error: `Unknown role "${raw.role}". Use security, host, or admin.`, raw });
      continue;
    }

    const parsed = inviteSchema.safeParse({
      fullName: raw.fullName,
      email: raw.email,
      role,
      department: raw.department || undefined,
    });
    if (!parsed.success) {
      rows.push({ line, ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid row.', raw });
      continue;
    }

    rows.push({ line, ok: true, value: parsed.data, raw });
    valid.push(parsed.data);
  }

  return { rows, valid, headerError: null };
}
