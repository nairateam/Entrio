'use client';

import { useState } from 'react';
import { ChevronDown, PenLine } from 'lucide-react';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { KioskButton } from './kiosk-button';

const SECTIONS = [
  {
    title: 'Professional conduct',
    body: 'We expect all guests to maintain a professional and respectful demeanor toward staff, residents, and other guests. Harassment, discriminatory language, or disruptive behavior will not be tolerated and may result in removal from the premises.',
  },
  {
    title: 'Health and safety',
    body: 'Your safety is our priority. Familiarize yourself with the emergency exit maps near every main entrance, and follow the instructions of safety wardens in the event of an alarm. Smoking, including e-cigarettes, is prohibited within the building.',
  },
  {
    title: 'Confidentiality and NDA',
    body: 'You may be exposed to confidential information during your visit. By signing, you agree not to record, share, or reproduce any proprietary information, and to honor any non-disclosure obligations communicated by your host.',
  },
];

/**
 * Ground rules / policy agreement (PRD v2 §3 Step 7). Numbered, expandable
 * sections + a tap-to-agree checkbox that gates the Accept & Sign action.
 */
export function PolicyCard({
  policyText,
  onAcceptAndSign,
}: {
  policyText?: string;
  onAcceptAndSign: () => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">Ground principles &amp; policy</h2>
      <p className="mt-1 text-sm text-indigo-500/80">
        Please review our facility guidelines for a safe and productive environment.
      </p>

      <div className="mt-6 max-h-72 space-y-1 overflow-y-auto pr-1">
        {SECTIONS.map((s, i) => {
          const isOpen = open[i] ?? false;
          return (
            <div key={s.title} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => setOpen((o) => ({ ...o, [i]: !isOpen }))}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-indigo-50 text-xs font-semibold text-[#1b2a6b]">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {s.title}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 text-slate-400 transition-transform duration-300', isOpen && 'rotate-180')}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-300 ease-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <p className="overflow-hidden pb-3 pl-9 text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            </div>
          );
        })}
        {policyText && <p className="px-1 pt-3 text-xs leading-relaxed text-slate-400">{policyText}</p>}
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
          <Checkbox
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="h-5 w-5 accent-[#1b2a6b]"
          />
          I have read and agree to the terms above
        </label>
        <KioskButton disabled={!accepted} onClick={onAcceptAndSign} className="px-6">
          Accept &amp; sign <PenLine className="h-4 w-4" />
        </KioskButton>
      </div>
    </div>
  );
}
