import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const notificationInclude = {
  visit: {
    select: {
      visitorName: true,
      visitor: { select: { fullName: true } },
      host: { select: { fullName: true } },
    },
  },
} satisfies Prisma.NotificationInclude;
type NotificationWithRefs = Prisma.NotificationGetPayload<{ include: typeof notificationInclude }>;

/** UI category for the inbox (web NotificationItem.type). */
type NotificationCategory = 'arrival' | 'override' | 'overstay' | 'response' | 'exception';

/** Denormalized inbox item (matches the web NotificationItem shape). */
export interface NotificationView {
  id: string;
  type: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const CATEGORY: Record<NotificationType, NotificationCategory> = {
  [NotificationType.arrival_alert]: 'arrival',
  [NotificationType.override_request]: 'override',
  [NotificationType.override_approved]: 'override',
  [NotificationType.overstay_alert]: 'overstay',
  [NotificationType.host_response]: 'response',
  [NotificationType.self_service_exception]: 'exception',
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The current user's notifications, newest first. */
  async list(userId: string): Promise<NotificationView[]> {
    const rows = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      include: notificationInclude,
      orderBy: { sentAt: 'desc' },
    });
    return rows.map((n) => this.toView(n));
  }

  /** Mark one notification read (scoped to the owner). No-op if not theirs. */
  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // --- helpers ---------------------------------------------------------------

  private toView(n: NotificationWithRefs): NotificationView {
    const visitorName = n.visit.visitor?.fullName ?? n.visit.visitorName ?? 'A visitor';
    const hostName = n.visit.host.fullName;
    const { title, body } = this.copy(n.type, visitorName, hostName, n.message);
    return {
      id: n.id,
      type: CATEGORY[n.type],
      title,
      body,
      createdAt: n.sentAt.toISOString(),
      read: n.readAt !== null,
    };
  }

  private copy(
    type: NotificationType,
    visitorName: string,
    hostName: string,
    message: string | null,
  ): { title: string; body: string } {
    switch (type) {
      case NotificationType.arrival_alert:
        return { title: 'Visitor arrived', body: `${visitorName} has checked in to see ${hostName}.` };
      case NotificationType.override_request:
        return {
          title: 'Override requested',
          body: `An after-hours override was requested for ${visitorName} (host ${hostName}).`,
        };
      case NotificationType.override_approved:
        return { title: 'Override approved', body: `The override for ${visitorName} was approved.` };
      case NotificationType.overstay_alert:
        return { title: 'Overstay alert', body: `${visitorName} has exceeded the visit time limit.` };
      case NotificationType.host_response:
        return {
          title: `${hostName} replied`,
          body: message ? `Re ${visitorName}: ${message}` : `${hostName} responded about ${visitorName}.`,
        };
      case NotificationType.self_service_exception:
        return {
          title: 'Front-desk attention needed',
          body: message ?? `A self-service check-in for ${visitorName} (host ${hostName}) needs staff assistance.`,
        };
      default:
        return { title: 'Notification', body: visitorName };
    }
  }
}
