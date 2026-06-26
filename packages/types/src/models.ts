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

/** A single page of results from a server-paginated list endpoint. */
export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

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
  /** Short typed entry code for pre-registered self-service check-in (PRD v2 §3.2). */
  entryCode: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  isOverride: boolean;
  overrideApprovedBy: string | null;
  /** Tap-to-agree consent captured at self-service check-in (PRD v2 §5.3). */
  consentAcceptedAt: string | null;
  consentVersion: string | null;
  notes: string | null;
  createdAt: string;
}

/** A shared self-service check-in device (PRD v2 §2.1). Not a human user. */
export interface Device {
  id: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
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
