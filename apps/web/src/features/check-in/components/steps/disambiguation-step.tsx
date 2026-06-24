'use client';

import { ChevronLeft, UserPlus } from 'lucide-react';
import { Avatar, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCheckInStore } from '../../store/use-check-in-store';
import { formatDate, initials, last4 } from '@/lib/format';

export function DisambiguationStep() {
  const results = useCheckInStore((s) => s.results);
  const selectMatch = useCheckInStore((s) => s.selectMatch);
  const startNewVisitor = useCheckInStore((s) => s.startNewVisitor);
  const goTo = useCheckInStore((s) => s.goTo);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {results.length} visitors match. Confirm the phone number with the visitor before
          selecting.
        </p>
      </div>

      <ul className="space-y-2">
        {results.map((result) => {
          const { visitor, lastVisitAt } = result;
          return (
          <li key={visitor.id}>
            <button
              type="button"
              onClick={() => selectMatch(result)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors',
                'hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <Avatar src={visitor.photoUrl} fallback={initials(visitor.fullName)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{visitor.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  Phone ending ••{last4(visitor.phone)} · Last visit {formatDate(lastVisitAt)}
                </p>
              </div>
              {result.expectedVisit && <Badge variant="secondary">Expected</Badge>}
              {visitor.isFlagged && <Badge variant="warning">Flagged</Badge>}
            </button>
          </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => goTo('search')}>
          <ChevronLeft className="h-4 w-4" />
          Back to search
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={startNewVisitor}>
          <UserPlus className="h-4 w-4" />
          None of these
        </Button>
      </div>
    </div>
  );
}
