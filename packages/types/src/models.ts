/**
 * Shared domain model shapes for the Entrio VMS.
 * These are transport/UI-facing types — they are intentionally decoupled from
 * the Prisma schema (which is defined later in apps/api).
 */
import type {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  UserRole,
  VisitStatus,
} from './enums';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  blockedBy: string | null;
  blockedAt: string | null;
  isFlagged: boolean;
  flaggedBy: string | null;
  flaggedAt: string | null;
  flagNote: string | null;
  createdAt: string;
}

export interface Visit {
  id: string;
  visitorId: string;
  hostId: string;
  checkedInBy: string | null;
  checkedOutBy: string | null;
  purpose: string | null;
  status: VisitStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  badgeCode: string | null;
  isOverride: boolean;
  overrideApprovedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  visitId: string;
  recipientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}
