'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui';
import { LiveBoard } from '@/features/live-board';
import { CheckInModal, useCheckInStore } from '@/features/check-in';

export default function BoardPage() {
  const reset = useCheckInStore((s) => s.reset);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const startCheckIn = () => {
    reset();
    setCheckInOpen(true);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today’s visits at a glance — search, check visitors out, and run the evacuation roll call.
          </p>
        </div>
        <Button onClick={startCheckIn}>
          <UserPlus className="h-4 w-4" />
          Check in a visitor
        </Button>
      </div>
      <LiveBoard />
      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </section>
  );
}
