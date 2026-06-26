'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, HelpCircle, LogIn, Mail, UserRound } from 'lucide-react';
import {
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { entryApi } from '../api/entry-api';
import { useAutoReturn } from '../hooks/use-auto-return';
import { useConsent } from '../hooks/use-consent';
import { useRequireDevice } from '../hooks/use-require-device';
import type { CheckInInput, CheckInResult, EntryHost, EntryVisit } from '../types';
import { EntryShell } from './entry-shell';
import { EntryButton } from './entry-button';
import { EntryStepper } from './entry-stepper';
import { HostCombobox } from './host-combobox';
import { PhotoCapture } from './photo-capture';
import { PolicyCard } from './policy-card';
import { SignaturePad } from './signature-pad';

type Step = 'type' | 'code' | 'info' | 'photo' | 'rules' | 'result';

const STEPS = ['Identification', 'Photo', 'Policy'];
const stepIndex: Partial<Record<Step, number>> = { code: 0, info: 0, photo: 1, rules: 2 };

export function EntryCheckIn() {
  const { ready } = useRequireDevice();
  const { data: consent } = useConsent();

  const [step, setStep] = useState<Step>('type');

  const [code, setCode] = useState('');
  const [prereg, setPrereg] = useState<EntryVisit | null>(null);

  const [info, setInfo] = useState({ fullName: '', phone: '', email: '', purpose: '' });
  const [host, setHost] = useState<EntryHost | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const lookupCode = useMutation({
    mutationFn: () => entryApi.lookupByCode(code),
    onSuccess: (v) => {
      setPrereg(v);
      setStep('photo');
    },
    onError: (e) =>
      toast.error(e instanceof ApiError && e.status === 404 ? 'No visit found for that code.' : 'Lookup failed.'),
  });

  const submit = useMutation({
    mutationFn: (sig: string) => {
      const input: CheckInInput = {
        consentVersion: consent?.version ?? '',
        consentAccepted: true,
        headshot: photo ?? undefined,
        signature: sig,
        purpose: info.purpose.trim() || prereg?.purpose || undefined,
        ...(prereg
          ? { expectedVisitId: prereg.id }
          : {
              newVisitor: {
                fullName: info.fullName.trim(),
                phone: info.phone.trim(),
                email: info.email.trim() || undefined,
              },
              hostId: host?.id,
            }),
      };
      return entryApi.checkIn(input);
    },
    onSuccess: (r) => {
      setSignOpen(false);
      setResult(r);
      setStep('result');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Check-in failed.'),
  });

  // Auto-return to Welcome 30s after a terminal screen so the next visitor can start.
  const returnIn = useAutoReturn(step === 'result');

  if (!ready) return null;

  const stepper =
    stepIndex[step] !== undefined ? <EntryStepper steps={STEPS} current={stepIndex[step]!} /> : undefined;

  // --- Step: visitor type ---------------------------------------------------
  if (step === 'type') {
    return (
      <EntryShell key="type" title="Check in" subtitle="Are you pre-registered, or a walk-in?" onBack={() => history.back()}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <EntryButton size="lg" className="h-28 flex-col gap-2 text-lg" onClick={() => setStep('code')}>
            <LogIn className="h-6 w-6" />
            I&apos;m pre-registered
          </EntryButton>
          <EntryButton entryVariant="soft" size="lg" className="h-28 flex-col gap-2 text-lg" onClick={() => setStep('info')}>
            <UserRound className="h-6 w-6" />
            Walk-in visit
          </EntryButton>
        </div>
      </EntryShell>
    );
  }

  // --- Step: pre-registered code -------------------------------------------
  if (step === 'code') {
    return (
      <EntryShell
        key="code"
        stepper={stepper}
        title="Enter your registration code"
        subtitle={
          <>
            Please type the <span className="font-medium text-warning">4-digit code</span> from your{' '}
            <span className="font-medium text-warning">invitation email</span> to proceed.
          </>
        }
        onBack={() => setStep('type')}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            lookupCode.mutate();
          }}
        >
          <div className="rounded-xl border border-border bg-card px-4 pb-2 pt-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <label className="text-xs font-medium text-muted-foreground">Registration code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
              maxLength={4}
              className="w-full bg-transparent text-center text-4xl font-semibold tracking-[0.4em] text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <EntryButton type="submit" size="lg" className="h-12 w-full" isLoading={lookupCode.isPending} disabled={!code.trim()}>
            Verify code <ArrowRight className="h-5 w-5" />
          </EntryButton>
          <EntryButton entryVariant="ghost" size="lg" className="w-full" onClick={() => setStep('type')} type="button">
            Back to options
          </EntryButton>
        </form>

        <div className="mt-6 flex items-center justify-center gap-6 border-t border-border pt-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Need help? Ask at reception
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Resend invitation code
          </span>
        </div>
      </EntryShell>
    );
  }

  // --- Step: walk-in info ---------------------------------------------------
  if (step === 'info') {
    const valid = info.fullName.trim() && info.phone.trim().length >= 3 && host;
    return (
      <EntryShell
        key="info"
        stepper={stepper}
        title="Your details"
        subtitle="Tell us who you are and who you're visiting."
        onBack={() => setStep('type')}
      >
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Field label="Full name">
            <Input
              value={info.fullName}
              onChange={(e) => setInfo((s) => ({ ...s, fullName: e.target.value }))}
              placeholder="Jane Doe"
              className="h-12 border-border text-base"
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input
                value={info.phone}
                onChange={(e) => setInfo((s) => ({ ...s, phone: e.target.value }))}
                placeholder="555 000 1234"
                className="h-12 border-border text-base"
              />
            </Field>
            <Field label="Email (optional)">
              <Input
                value={info.email}
                onChange={(e) => setInfo((s) => ({ ...s, email: e.target.value }))}
                placeholder="jane@example.com"
                type="email"
                className="h-12 border-border text-base"
              />
            </Field>
          </div>

          <Field label="Who are you visiting?">
            <HostCombobox value={host} onChange={setHost} />
          </Field>

          <Field label="Purpose">
            <Input
              value={info.purpose}
              onChange={(e) => setInfo((s) => ({ ...s, purpose: e.target.value }))}
              placeholder="Meeting, Interview, Delivery…"
              className="h-12 border-border text-base"
            />
          </Field>
        </div>

        <EntryButton size="lg" className="mt-5 h-12 w-full" disabled={!valid} onClick={() => setStep('photo')}>
          Continue <ArrowRight className="h-5 w-5" />
        </EntryButton>
      </EntryShell>
    );
  }

  // --- Step: photo ----------------------------------------------------------
  if (step === 'photo') {
    return (
      <EntryShell
        key="photo"
        stepper={stepper}
        title="Smile for the camera"
        subtitle="Center your face within the guide for your security badge."
        onBack={() => setStep(prereg ? 'code' : 'info')}
      >
        <PhotoCapture value={photo} onChange={setPhoto} />
        <EntryButton size="lg" className="mt-6 h-12 w-full" disabled={!photo} onClick={() => setStep('rules')}>
          Looks good <ArrowRight className="h-5 w-5" />
        </EntryButton>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Your data is processed securely and encrypted for privacy protection.
        </p>
      </EntryShell>
    );
  }

  // --- Step: rules + signature ---------------------------------------------
  if (step === 'rules') {
    return (
      <EntryShell key="rules" stepper={stepper} align="left" onBack={() => setStep('photo')}>
        <PolicyCard policyText={consent?.text} onAcceptAndSign={() => setSignOpen(true)} />

        <Modal open={signOpen} onClose={() => (submit.isPending ? null : setSignOpen(false))} size="lg">
          <ModalHeader>
            <ModalTitle>Sign to confirm</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="mb-3 text-sm text-muted-foreground">
              By signing, you agree to the ground rules and site policy.
            </p>
            <SignaturePad onChange={setSignature} />
          </ModalBody>
          <ModalFooter>
            <EntryButton entryVariant="ghost" onClick={() => setSignOpen(false)} disabled={submit.isPending}>
              Cancel
            </EntryButton>
            <EntryButton
              isLoading={submit.isPending}
              disabled={!signature || !consent?.version}
              onClick={() => signature && submit.mutate(signature)}
            >
              Confirm check-in
            </EntryButton>
          </ModalFooter>
        </Modal>
      </EntryShell>
    );
  }

  // --- Step: result ---------------------------------------------------------
  if (result?.status === 'success') {
    return (
      <EntryShell key="ok">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-foreground">You&apos;re all set!</h1>
          <p className="mt-2 text-base text-muted-foreground">
            {result.visitorName}, {result.hostName} has been notified. Please have a seat.
          </p>
          <div className="mt-6 rounded-xl bg-accent p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your code</p>
            <p className="mt-1 text-4xl font-bold tracking-[0.2em] text-primary">{result.entryCode}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Keep this to check out later.</p>
          </div>
          <EntryButton asChild entryVariant="soft" size="lg" className="mt-7 w-full">
            <Link href="/">Done</Link>
          </EntryButton>
          <p className="mt-4 text-xs text-muted-foreground">Returning to start in {returnIn}s…</p>
        </div>
      </EntryShell>
    );
  }

  return (
    <EntryShell key="redirect">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Almost there</h1>
        <p className="mt-3 text-base text-muted-foreground">
          We&apos;re unable to complete your check-in right now. Please see the front desk for assistance.
        </p>
        <EntryButton asChild entryVariant="soft" size="lg" className="mt-7 w-full">
          <Link href="/">Done</Link>
        </EntryButton>
        <p className="mt-4 text-xs text-muted-foreground">Returning to start in {returnIn}s…</p>
      </div>
    </EntryShell>
  );
}

/** Labeled field wrapper for the walk-in form. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
