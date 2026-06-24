'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
} from '@/components/ui';
import { NAV_BY_ROLE } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api/client';
import { setPassword, validateSetPasswordToken } from '../api/auth-api';
import { setPasswordSchema, type SetPasswordInput } from '../schema';

type TokenState =
  | { status: 'checking' }
  | { status: 'valid'; email: string }
  | { status: 'invalid'; message: string };

export function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const signIn = useAuthStore((s) => s.signIn);

  const [tokenState, setTokenState] = useState<TokenState>({ status: 'checking' });
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setTokenState({ status: 'invalid', message: 'This link is missing its token.' });
      return;
    }
    validateSetPasswordToken(token)
      .then((r) => !cancelled && setTokenState({ status: 'valid', email: r.email }))
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : 'This link is invalid or has expired.';
        setTokenState({ status: 'invalid', message });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (values: SetPasswordInput) => {
    setFormError(null);
    try {
      const { user } = await setPassword(token, values.password);
      signIn(user);
      router.push(NAV_BY_ROLE[user.role][0]?.href ?? '/');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>
          {tokenState.status === 'valid'
            ? `Choose a password for ${tokenState.email}.`
            : 'Activate your Entrio account.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tokenState.status === 'checking' && (
          <div className="flex items-center justify-center py-10">
            <Spinner size={24} />
          </div>
        )}

        {tokenState.status === 'invalid' && (
          <div className="space-y-4">
            <Alert variant="destructive">{tokenState.message}</Alert>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Back to sign in
            </Button>
          </div>
        )}

        {tokenState.status === 'valid' && (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {formError && <Alert variant="destructive">{formError}</Alert>}

            <div className="space-y-1.5">
              <Label htmlFor="password" required>
                New password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                error={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" required>
                Confirm password
              </Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                error={Boolean(errors.confirm)}
                {...register('confirm')}
              />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Set password & sign in
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
