'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
  Switch,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import {
  useAddBlackout,
  useBlackoutDates,
  useRemoveBlackout,
  useSaveWorkingHours,
  useWorkingHours,
} from '../hooks/use-working-hours';
import { DAY_NAMES, type WorkingHour } from '../types';

export function WorkingHoursManager() {
  const { data: serverHours = [], isLoading, isError } = useWorkingHours();
  const { data: blackouts = [] } = useBlackoutDates();
  const saveHours = useSaveWorkingHours();
  const addBlackout = useAddBlackout();
  const removeBlackout = useRemoveBlackout();

  // Editable draft of the weekly hours, synced from the server copy.
  const [draft, setDraft] = useState<WorkingHour[] | null>(null);
  useEffect(() => {
    if (serverHours.length) setDraft(serverHours);
  }, [serverHours]);
  const hours = draft ?? serverHours;

  const setHour = (dayOfWeek: number, patch: Partial<WorkingHour>) =>
    setDraft((d) => (d ?? serverHours).map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));

  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  const submitBlackout = () => {
    if (!newDate || !newReason.trim()) return;
    addBlackout.mutate(
      { date: newDate, reason: newReason },
      {
        onSuccess: () => {
          setNewDate('');
          setNewReason('');
        },
      },
    );
  };

  if (isLoading && hours.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isError && <Alert variant="destructive">Could not load working hours.</Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hours.map((h) => (
            <div key={h.dayOfWeek} className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm font-medium">{DAY_NAMES[h.dayOfWeek]}</span>
              <Switch
                checked={h.isActive}
                onCheckedChange={(checked) => setHour(h.dayOfWeek, { isActive: checked })}
              />
              <Input
                type="time"
                className="w-32"
                value={h.openTime}
                disabled={!h.isActive}
                onChange={(e) => setHour(h.dayOfWeek, { openTime: e.target.value })}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                className="w-32"
                value={h.closeTime}
                disabled={!h.isActive}
                onChange={(e) => setHour(h.dayOfWeek, { closeTime: e.target.value })}
              />
              {!h.isActive && <span className="text-sm text-muted-foreground">Closed</span>}
            </div>
          ))}
          <div className="pt-2">
            <Button onClick={() => saveHours.mutate(hours)} isLoading={saveHours.isPending}>
              Save hours
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blackout dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blackouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blackout dates.</p>
          ) : (
            <ul className="space-y-2">
              {blackouts.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{formatDate(b.date)}</p>
                    <p className="text-xs text-muted-foreground">{b.reason}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove blackout date"
                    onClick={() => removeBlackout.mutate(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <Input
              type="date"
              className="w-40"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input
              className="min-w-48 flex-1"
              placeholder="Reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={submitBlackout}
              disabled={!newDate || !newReason.trim() || addBlackout.isPending}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
