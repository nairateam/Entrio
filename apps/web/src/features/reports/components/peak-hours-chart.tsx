import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { HourBucket } from '../types';

/** Lightweight CSS bar chart of arrivals by hour (PRD §4.9 peak-hour chart). */
export function PeakHoursChart({ buckets }: { buckets: HourBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Arrivals by hour</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-1">
          {buckets.map((b) => (
            <div key={b.hour} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    'w-full rounded-t bg-primary/80 transition-all',
                    b.count === 0 && 'bg-muted',
                  )}
                  style={{ height: `${(b.count / max) * 100}%` }}
                  title={`${b.count} at ${b.hour}:00`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{b.hour}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
