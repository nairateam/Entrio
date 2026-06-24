'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
  Textarea,
  toast,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import { MOCK_CURRENT_HOST } from '../api/hosts-api';
import { restrictionSchema, type RestrictionInput } from '../schema';
import { useRestrictionsStore } from '../store/use-restrictions-store';

export function RestrictionsManager() {
  const restrictions = useRestrictionsStore((s) => s.restrictions);
  const isLoading = useRestrictionsStore((s) => s.isLoading);
  const error = useRestrictionsStore((s) => s.error);
  const liftingId = useRestrictionsStore((s) => s.liftingId);
  const load = useRestrictionsStore((s) => s.load);
  const add = useRestrictionsStore((s) => s.add);
  const lift = useRestrictionsStore((s) => s.lift);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestrictionInput>({
    resolver: zodResolver(restrictionSchema),
    defaultValues: { visitorName: '', visitorPhone: '', reason: '' },
  });

  useEffect(() => {
    void load(MOCK_CURRENT_HOST.id);
  }, [load]);

  const onSubmit = async (values: RestrictionInput) => {
    try {
      await add(MOCK_CURRENT_HOST.id, values);
      reset();
    } catch {
      toast.error('Could not add the restriction.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive">{error}</Alert>}
          {isLoading && restrictions.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size={24} />
            </div>
          ) : restrictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven’t restricted any visitors. They can still be received by other hosts.
            </p>
          ) : (
            <ul className="space-y-2">
              {restrictions.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{r.visitorName}</p>
                    <p className="text-xs text-muted-foreground">{r.visitorPhone}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Since {formatDate(r.createdAt)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void lift(r.id)}
                    isLoading={liftingId === r.id}
                  >
                    Lift
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restrict a visitor</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="r-name" required>
                Visitor name
              </Label>
              <Input id="r-name" error={Boolean(errors.visitorName)} {...register('visitorName')} />
              {errors.visitorName && (
                <p className="text-xs text-destructive">{errors.visitorName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-phone" required>
                Phone
              </Label>
              <Input id="r-phone" error={Boolean(errors.visitorPhone)} {...register('visitorPhone')} />
              {errors.visitorPhone && (
                <p className="text-xs text-destructive">{errors.visitorPhone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-reason" required>
                Reason (private)
              </Label>
              <Textarea
                id="r-reason"
                placeholder="Only you and Admin can see this."
                error={Boolean(errors.reason)}
                {...register('reason')}
              />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
            </div>
            <Button type="submit" isLoading={isSubmitting}>
              Add restriction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
