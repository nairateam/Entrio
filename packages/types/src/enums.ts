/**
 * Shared enums for the Entrio Visitor Management System.
 * Kept framework-agnostic so both the web app and the API can consume them.
 */

/** Anyone with a login to the system. */
export enum UserRole {
  SECURITY = 'security',
  HOST = 'host',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPERVISOR = 'supervisor',
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
}

/** Delivery channel for a notification. */
export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

/** Delivery state of a notification. */
export enum NotificationStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}
