'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Alert,
  Button,
  Input,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export interface DataTableFilterDef {
  id: string;
  /** Used for the "All …" option and the select's aria-label. */
  label: string;
  options: Array<{ value: string; label: string }>;
}

/** Server-driven table state: the caller turns this into a paginated query. */
export interface TableState {
  search: string;
  filters: Record<string, string>;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export function initialTableState(overrides: Partial<TableState> = {}): TableState {
  return { search: '', filters: {}, page: 1, pageSize: DEFAULT_PAGE_SIZE, ...overrides };
}

export interface DataTableProps<T> {
  /** Rows for the current page (already filtered/paged by the server). */
  rows: T[];
  /** Total matching rows across all pages. */
  total: number;
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  state: TableState;
  onStateChange: (next: TableState) => void;
  /** Enable the search box (search is sent to the server). */
  search?: { placeholder?: string };
  /** Dropdown filters (values are sent to the server). */
  filters?: DataTableFilterDef[];
  /** Extra controls in the toolbar (e.g. a date range that drives the query). */
  toolbar?: ReactNode;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  errorText?: string;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

/**
 * Presentational table for **server-paginated** data. It owns no data — search,
 * filters, page, and page size live in `state` and every change is emitted via
 * `onStateChange` for the caller to feed into its paginated query. Search is
 * debounced; changing search/filters/page-size resets to page 1.
 */
export function DataTable<T>({
  rows,
  total,
  columns,
  getRowKey,
  state,
  onStateChange,
  search,
  filters = [],
  toolbar,
  isLoading,
  isFetching,
  isError,
  errorText = 'Could not load data.',
  emptyText = 'No results.',
  onRowClick,
}: DataTableProps<T>) {
  // Local search input, debounced into the shared state.
  const [searchInput, setSearchInput] = useState(state.search);
  useEffect(() => setSearchInput(state.search), [state.search]);
  useEffect(() => {
    if (searchInput === state.search) return;
    const t = setTimeout(() => onStateChange({ ...state, search: searchInput, page: 1 }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const setFilter = (id: string, value: string) =>
    onStateChange({ ...state, filters: { ...state.filters, [id]: value }, page: 1 });
  const setPageSize = (pageSize: number) => onStateChange({ ...state, pageSize, page: 1 });
  const goToPage = (page: number) => onStateChange({ ...state, page });

  const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
  const from = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const to = Math.min(total, state.page * state.pageSize);
  const hasToolbar = Boolean(search) || filters.length > 0 || Boolean(toolbar);

  return (
    <div className="space-y-4">
      {hasToolbar && (
        <div className="flex flex-wrap items-end gap-3">
          {search && (
            <Input
              className="max-w-xs"
              placeholder={search.placeholder ?? 'Search…'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          )}
          {filters.map((f) => (
            <Select
              key={f.id}
              aria-label={f.label}
              className="max-w-[12rem]"
              value={state.filters[f.id] ?? 'all'}
              onChange={(e) => setFilter(f.id, e.target.value)}
            >
              <option value="all">All {f.label.toLowerCase()}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ))}
          {toolbar}
        </div>
      )}

      {isError && <Alert variant="destructive">{errorText}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead
                    key={c.id}
                    className={cn(c.align === 'right' && 'text-right', c.className)}
                  >
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(c.align === 'right' && 'text-right', c.className)}
                    >
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination controls — always shown so the page size is switchable. */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            aria-label="Rows per page"
            className="w-20"
            value={String(state.pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={state.page <= 1}
              onClick={() => goToPage(state.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-1">
              Page {Math.min(state.page, pageCount)} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={state.page >= pageCount}
              onClick={() => goToPage(state.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
