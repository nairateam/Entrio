import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@entrio/types';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more roles. Enforced by RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
