import { UserRole } from '@entrio/types';
import type { UserRole as PrismaUserRole } from '@prisma/client';

/**
 * Bridges Prisma's generated `UserRole` (a string union) to the `@entrio/types`
 * `UserRole` enum. The string values are identical, but the two are distinct
 * nominal types, so map at the Prisma boundary instead of casting.
 *
 * The `Record<PrismaUserRole, …>` makes this exhaustive — if a role is added to
 * the Prisma enum, TypeScript flags this map until it's handled.
 */
const PRISMA_TO_USER_ROLE: Record<PrismaUserRole, UserRole> = {
  security: UserRole.SECURITY,
  host: UserRole.HOST,
  admin: UserRole.ADMIN,
  super_admin: UserRole.SUPER_ADMIN,
  supervisor: UserRole.SUPERVISOR,
};

export function toUserRole(role: PrismaUserRole): UserRole {
  return PRISMA_TO_USER_ROLE[role];
}
