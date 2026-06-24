'use client';

import { useEffect, useMemo } from 'react';
import { ShieldAlert, Users } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Spinner,
} from '@/components/ui';
import { STATUS_LABELS } from '@/components/shared/visit-status-badge';
import { cn } from '@/lib/utils';
import { useLiveBoardStore } from '../store/use-live-board-store';
import { STATUS_FILTER_OPTIONS, filterVisits, insideVisits } from '../utils';
import type { BoardView } from '../types';
import { VisitsTable } from './visits-table';
import { WhosInside } from './whos-inside';
import { CheckOutModal } from './check-out-modal';
import { FlagModal } from './flag-modal';

export function LiveBoard() {
  const visits = useLiveBoardStore((s) => s.visits);
  const isLoading = useLiveBoardStore((s) => s.isLoading);
  const error = useLiveBoardStore((s) => s.error);
  const query = useLiveBoardStore((s) => s.query);
  const statusFilter = useLiveBoardStore((s) => s.statusFilter);
  const view = useLiveBoardStore((s) => s.view);
  const setQuery = useLiveBoardStore((s) => s.setQuery);
  const setStatusFilter = useLiveBoardStore((s) => s.setStatusFilter);
  const setView = useLiveBoardStore((s) => s.setView);
  const requestCheckout = useLiveBoardStore((s) => s.requestCheckout);
  const requestFlag = useLiveBoardStore((s) => s.requestFlag);
  const load = useLiveBoardStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const inside = useMemo(() => insideVisits(visits), [visits]);
  const filtered = useMemo(
    () => filterVisits(visits, query, statusFilter),
    [visits, query, statusFilter],
  );

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Prominent "Who's Inside Now" summary — always visible (PRD §4.10). */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{inside.length} inside now</p>
              <p className="text-sm text-muted-foreground">Live headcount for evacuation</p>
            </div>
          </div>
          <Button
            variant={view === 'inside' ? 'primary' : 'outline'}
            onClick={() => setView('inside')}
          >
            <ShieldAlert className="h-4 w-4" />
            Evacuation roll call
          </Button>
        </CardContent>
      </Card>

      {/* View toggle */}
      <div className="inline-flex rounded-md border border-border p-0.5">
        {(['today', 'inside'] as BoardView[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-colors',
              view === v
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {v === 'today' ? "Today's visits" : "Who's inside"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : view === 'inside' ? (
        <WhosInside visits={inside} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              className="max-w-xs"
              placeholder="Search name, host, phone, badge…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              className="max-w-[12rem]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All statuses' : STATUS_LABELS[option]}
                </option>
              ))}
            </Select>
          </div>
          <VisitsTable visits={filtered} onCheckout={requestCheckout} onFlag={requestFlag} />
        </div>
      )}

      <CheckOutModal />
      <FlagModal />
    </div>
  );
}
