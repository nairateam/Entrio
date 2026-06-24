'use client';

import { VisitStatus } from '@entrio/types';
import { Button, Input, Label, Select } from '@/components/ui';
import { STATUS_LABELS } from '@/components/shared/visit-status-badge';
import { useFilterOptions } from '../hooks/use-reports';
import { useReportsFiltersStore } from '../store/use-reports-filters-store';

const STATUS_OPTIONS: Array<VisitStatus | 'all'> = ['all', ...Object.values(VisitStatus)];

export function FiltersBar() {
  const filters = useReportsFiltersStore((s) => s.filters);
  const setFilter = useReportsFiltersStore((s) => s.setFilter);
  const resetFilters = useReportsFiltersStore((s) => s.resetFilters);
  const { data: options = { departments: [], hosts: [] } } = useFilterOptions();

  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1.5">
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          type="date"
          value={filters.from}
          max={filters.to}
          onChange={(e) => void setFilter({ from: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="date"
          value={filters.to}
          min={filters.from}
          onChange={(e) => void setFilter({ to: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="department">Department</Label>
        <Select
          id="department"
          value={filters.department}
          onChange={(e) => void setFilter({ department: e.target.value })}
        >
          <option value="all">All departments</option>
          {options.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="host">Host</Label>
        <Select
          id="host"
          value={filters.hostId}
          onChange={(e) => void setFilter({ hostId: e.target.value })}
        >
          <option value="all">All hosts</option>
          {options.hosts.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          value={filters.status}
          onChange={(e) => void setFilter({ status: e.target.value as VisitStatus | 'all' })}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end">
        <Button variant="outline" className="w-full" onClick={() => void resetFilters()}>
          Reset
        </Button>
      </div>
    </div>
  );
}
