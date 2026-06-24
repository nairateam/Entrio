import {
  Activity,
  Ban,
  BarChart3,
  CalendarPlus,
  ClipboardList,
  Flag,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldBan,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@entrio/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only highlight on an exact path match (used for section "home" links). */
  exact?: boolean;
}

/**
 * Per-role navigation, derived from the PRD §2.1 permission matrix.
 * Each role only sees destinations for actions it is permitted to perform.
 * Sub-routes beyond the section home are scaffolding ahead of their pages.
 */

// Security: front-desk operations — check-in/out, badge scan, search, flag, live board.
const security: NavItem[] = [
  { label: 'Overview', href: '/security', icon: LayoutDashboard, exact: true },
  { label: 'Live Board', href: '/security/board', icon: Activity },
  { label: 'Visitations', href: '/security/visitations', icon: ClipboardList },
];

// Host: pre-register, see own visitors, restrict a visitor from visiting them.
const host: NavItem[] = [
  { label: 'Overview', href: '/host', icon: LayoutDashboard, exact: true },
  { label: 'My Visitors', href: '/host/visitors', icon: Users },
  { label: 'Pre-register', href: '/host/pre-register', icon: CalendarPlus },
  { label: 'Restrictions', href: '/host/restrictions', icon: ShieldBan },
];

// Admin: working hours/blackout, blocklist, flagged, overrides, reports, audit,
// live board, plus system config and user management (PRD v1.1 §2).
const admin: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Live Board', href: '/admin/live-board', icon: Activity },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Blocklist', href: '/admin/blocklist', icon: Ban },
  { label: 'Flagged', href: '/admin/flagged', icon: Flag },
  { label: 'Overrides', href: '/admin/overrides', icon: ShieldCheck },
  { label: 'Users', href: '/admin/users', icon: UserCog },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  [UserRole.SECURITY]: security,
  [UserRole.HOST]: host,
  [UserRole.ADMIN]: admin,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SECURITY]: 'Security',
  [UserRole.HOST]: 'Host',
  [UserRole.ADMIN]: 'Admin',
};
