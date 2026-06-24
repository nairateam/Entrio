'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@/components/ui';
import { NAV_BY_ROLE } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { InvalidCredentialsError, login } from '../api/auth-api';
import { DEMO_EMAILS } from '../fixtures';
import { loginSchema, type LoginInput } from '../schema';

export function LoginForm() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const { user } = await login(values);
      signIn(user);
      // Land on the role's first nav destination (its dashboard home).
      const home = NAV_BY_ROLE[user.role][0]?.href ?? '/';
      router.push(home);
    } catch (err) {
      setFormError(
        err instanceof InvalidCredentialsError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'password', { shouldValidate: true });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in to Entrio</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && <Alert variant="destructive">{formError}</Alert>}

          <div className="space-y-1.5">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              error={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        {/* Mock-only helper — remove with the fixtures once real auth lands. */}
        <div className="mt-6 space-y-2 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">Demo accounts (any password, 6+ chars):</p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_EMAILS.map((email) => (
              <Button
                key={email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo(email)}
              >
                {email}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
