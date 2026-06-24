import { z } from 'zod';

/** Today's date as YYYY-MM-DD, for the "not in the past" check. */
function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Pre-registration form schema (PRD §4.4): visitor details + expected date/time.
 * Email/purpose are optional; empty strings are normalized to undefined.
 */
export const preRegisterSchema = z.object({
  visitorName: z.string().trim().min(2, 'Enter the visitor’s full name'),
  visitorPhone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .regex(/[0-9]/, 'Phone number must contain digits'),
  visitorEmail: z
    .union([z.string().trim().email('Enter a valid email'), z.literal('')])
    .optional(),
  purpose: z.string().trim().max(200, 'Keep the purpose under 200 characters').optional(),
  expectedDate: z
    .string()
    .min(1, 'Select a date')
    .refine((date) => date >= todayISODate(), 'Date cannot be in the past'),
  expectedTime: z.string().min(1, 'Select a time'),
});

export type PreRegisterInput = z.infer<typeof preRegisterSchema>;

/** Add-restriction form schema (PRD §4.11). */
export const restrictionSchema = z.object({
  visitorName: z.string().trim().min(2, 'Enter the visitor’s full name'),
  visitorPhone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .regex(/[0-9]/, 'Phone number must contain digits'),
  reason: z.string().trim().min(1, 'A private reason is required'),
});

export type RestrictionInput = z.infer<typeof restrictionSchema>;
