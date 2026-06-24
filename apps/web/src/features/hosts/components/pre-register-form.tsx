'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { MOCK_CURRENT_HOST, preRegisterVisit } from '../api/hosts-api';
import { preRegisterSchema, type PreRegisterInput } from '../schema';
import type { HostVisit } from '../types';

export function PreRegisterForm() {
  const router = useRouter();
  const [created, setCreated] = useState<HostVisit | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PreRegisterInput>({
    resolver: zodResolver(preRegisterSchema),
    defaultValues: {
      visitorName: '',
      visitorPhone: '',
      visitorEmail: '',
      purpose: '',
      expectedDate: '',
      expectedTime: '',
    },
  });

  const onSubmit = async (values: PreRegisterInput) => {
    setSubmitError(null);
    try {
      const visit = await preRegisterVisit(MOCK_CURRENT_HOST.id, values);
      setCreated(visit);
      reset();
    } catch {
      setSubmitError('Could not pre-register the visitor. Please try again.');
    }
  };

  if (created) {
    return (
      <Card className="max-w-xl">
        <CardContent className="space-y-4 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <div>
            <h3 className="text-lg font-semibold">Visitor pre-registered</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {created.visitorName} is expected {formatDateTime(created.expectedTime)}. They’ll show
              as “Expected” on Security’s board.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setCreated(null)}>
              Pre-register another
            </Button>
            <Button onClick={() => router.push('/host')}>Back to dashboard</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {submitError && <Alert variant="destructive">{submitError}</Alert>}

          <div className="space-y-1.5">
            <Label htmlFor="visitorName" required>
              Visitor name
            </Label>
            <Input id="visitorName" error={Boolean(errors.visitorName)} {...register('visitorName')} />
            {errors.visitorName && (
              <p className="text-xs text-destructive">{errors.visitorName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="visitorPhone" required>
                Phone
              </Label>
              <Input
                id="visitorPhone"
                error={Boolean(errors.visitorPhone)}
                {...register('visitorPhone')}
              />
              {errors.visitorPhone && (
                <p className="text-xs text-destructive">{errors.visitorPhone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="visitorEmail">Email</Label>
              <Input
                id="visitorEmail"
                type="email"
                error={Boolean(errors.visitorEmail)}
                {...register('visitorEmail')}
              />
              {errors.visitorEmail && (
                <p className="text-xs text-destructive">{errors.visitorEmail.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expectedDate" required>
                Expected date
              </Label>
              <Input
                id="expectedDate"
                type="date"
                error={Boolean(errors.expectedDate)}
                {...register('expectedDate')}
              />
              {errors.expectedDate && (
                <p className="text-xs text-destructive">{errors.expectedDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedTime" required>
                Expected time
              </Label>
              <Input
                id="expectedTime"
                type="time"
                error={Boolean(errors.expectedTime)}
                {...register('expectedTime')}
              />
              {errors.expectedTime && (
                <p className="text-xs text-destructive">{errors.expectedTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purpose">Purpose of visit</Label>
            <Textarea
              id="purpose"
              placeholder="e.g. Interview, quarterly sync, delivery"
              error={Boolean(errors.purpose)}
              {...register('purpose')}
            />
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => router.push('/host')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Pre-register visitor
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
