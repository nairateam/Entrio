import { UserRole, type User } from '@entrio/types';

/**
 * Demo accounts for the mock login (see ./api/auth-api.ts). Each maps an email
 * to a user with a distinct role so the post-login redirect lands on the right
 * dashboard. Any password (6+ chars) is accepted while auth is stubbed.
 *
 * Remove once the backend auth module is wired.
 */
const ts = '2026-01-01T00:00:00.000Z';

function account(overrides: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'department'>): User {
  return {
    phone: null,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

export const MOCK_ACCOUNTS: Record<string, User> = {
  'security@entrio.dev': account({
    id: 'user-security',
    fullName: 'Sam Okonkwo',
    email: 'security@entrio.dev',
    role: UserRole.SECURITY,
    department: 'Front Desk',
  }),
  'host@entrio.dev': account({
    id: 'user-host',
    fullName: 'Sarah Chen',
    email: 'host@entrio.dev',
    role: UserRole.HOST,
    department: 'Engineering',
  }),
  'admin@entrio.dev': account({
    id: 'user-admin',
    fullName: 'Ada Lovelace',
    email: 'admin@entrio.dev',
    role: UserRole.ADMIN,
    department: 'Operations',
  }),
};

export const DEMO_EMAILS = Object.keys(MOCK_ACCOUNTS);
