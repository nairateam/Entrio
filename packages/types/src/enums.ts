/**
 * Shared enums for the Entrio Visitor Management System.
 * Kept framework-agnostic so both the web app and the API can consume them.
 */

/** Anyone with a login to the system (PRD v1.1 §2). */
export enum UserRole {
  SECURITY = 'security',
  HOST = 'host',
  ADMIN = 'admin',
}

/** Lifecycle of a single visit (one visitor, one check-in event). */
export enum VisitStatus {
  EXPECTED = 'expected',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  NO_SHOW = 'no_show',
  DENIED = 'denied',
}

/** What a notification is about. */
export enum NotificationType {
  ARRIVAL_ALERT = 'arrival_alert',
  OVERRIDE_REQUEST = 'override_request',
  OVERRIDE_APPROVED = 'override_approved',
  OVERSTAY_ALERT = 'overstay_alert',
  HOST_RESPONSE = 'host_response',
  /** Self-service check-in hit a gate (blocklist / restriction / after-hours) — staff must step in. */
  SELF_SERVICE_EXCEPTION = 'self_service_exception',
  /** A walk-in checked in without a host — front desk must assign one. */
  HOST_ASSIGNMENT = 'host_assignment',
}

/** Delivery channel for a notification. */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

/** Delivery state of a notification. */
export enum NotificationStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}
