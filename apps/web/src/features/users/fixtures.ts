import { UserRole, type User } from '@entrio/types';

const ts = '2026-01-01T00:00:00.000Z';

/** Mock user directory for super-admin management. */
export const MOCK_USERS: User[] = [
  {
    id: 'user-admin',
    fullName: 'Ada Lovelace',
    email: 'admin@entrio.dev',
    phone: null,
    role: UserRole.ADMIN,
    department: 'Operations',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'user-security',
    fullName: 'Sam Okonkwo',
    email: 'security@entrio.dev',
    phone: null,
    role: UserRole.SECURITY,
    department: 'Front Desk',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'user-host-1',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@nativebrands.co',
    phone: null,
    role: UserRole.HOST,
    department: 'Engineering',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'user-supervisor',
    fullName: 'Marcus Reed',
    email: 'marcus.reed@nativebrands.co',
    phone: null,
    role: UserRole.SUPERVISOR,
    department: 'Security',
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'user-host-2',
    fullName: 'Priya Patel',
    email: 'priya.patel@nativebrands.co',
    phone: null,
    role: UserRole.HOST,
    department: 'Legal',
    isActive: false,
    createdAt: ts,
    updatedAt: ts,
  },
];
