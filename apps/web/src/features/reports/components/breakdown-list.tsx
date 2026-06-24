import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { CountBreakdown } from '../types';

/** Ranked counts (visits per host / per department) with a proportional bar. */
export function BreakdownList({ title, items }: { title: string; items: CountBreakdown[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for the selected filters.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{item.label}</span>
                <span className="font-medium text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
