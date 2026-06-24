import { z } from 'zod';
import { UserRole } from '@entrio/types';

/** Invite-user form schema. */
export const inviteSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name'),
  email: z.string().trim().min(1, 'Enter an email').email('Enter a valid email'),
  role: z.nativeEnum(UserRole),
  department: z.string().trim().optional(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
