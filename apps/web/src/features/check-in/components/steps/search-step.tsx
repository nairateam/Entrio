'use client';

import { Search } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useCheckInStore } from '../../store/use-check-in-store';

export function SearchStep() {
  const query = useCheckInStore((s) => s.query);
  const isSearching = useCheckInStore((s) => s.isSearching);
  const setQuery = useCheckInStore((s) => s.setQuery);
  const search = useCheckInStore((s) => s.search);
  const startNewVisitor = useCheckInStore((s) => s.startNewVisitor);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void search();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="visitor-search">Search visitor</Label>
        <div className="flex gap-2">
          <Input
            id="visitor-search"
            autoFocus
            placeholder="Name or phone number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" isLoading={isSearching} disabled={!query.trim()}>
            {!isSearching && <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Visitors are never matched by name alone — confirm the phone number before selecting.
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={startNewVisitor}>
        Register a new visitor
      </Button>
    </form>
  );
}
