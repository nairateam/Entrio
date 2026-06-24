/** Default page size for list endpoints (matches the web table default). */
export const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

export interface PageArgs {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/** Parse raw `page`/`pageSize` query strings into safe, clamped pagination args. */
export function parsePageArgs(page?: string, pageSize?: string): PageArgs {
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  const sizeRaw = Math.floor(Number(pageSize)) || DEFAULT_PAGE_SIZE;
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, sizeRaw));
  return { page: p, pageSize: size, skip: (p - 1) * size, take: size };
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Wrap rows + a total count into the standard paginated response shape. */
export function paginated<T>(rows: T[], total: number, args: PageArgs): Paginated<T> {
  return { rows, total, page: args.page, pageSize: args.pageSize };
}
