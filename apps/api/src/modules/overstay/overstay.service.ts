import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationChannel, NotificationType, UserRole, VisitStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { visitorDisplayName } from '../../common/visit-name';
import { PushService } from '../../integrations/web-push/push.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';

/**
 * Overstay handling (PRD §4.6). Two scheduled sweeps:
 *  - every 30 min: alert host + front desk once a visitor passes the overstay
 *    threshold (so a human can act while they may still be on-site);
 *  - daily at 23:00: auto-close anyone still checked in (marked `autoCheckedOut`,
 *    distinct from a real check-out) and expire no-show pre-registrations,
 *    recycling their entry codes.
 */
@Injectable()
export class OverstayService {
  private readonly logger = new Logger(OverstayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly push: PushService,
    private readonly audit: AuditService,
  ) {}

  /** Alert on visitors past the overstay threshold (PRD §4.6) — once per visit. */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async sweepOverstays(): Promise<void> {
    const hours = this.settings.get().overstayThresholdHours;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const overdue = await this.prisma.visit.findMany({
      where: { status: VisitStatus.checked_in, checkInTime: { lt: cutoff } },
      include: { visitor: { select: { fullName: true } }, host: { select: { fullName: true } } },
    });
    if (overdue.length === 0) return;

    const security = await this.prisma.user.findMany({
      where: { role: UserRole.security, isActive: true },
      select: { id: true },
    });
    const pushOn = this.settings.get().pushNotifications;
    let alerted = 0;

    for (const v of overdue) {
      // Dedupe: one overstay alert per visit.
      const already = await this.prisma.notification.count({
        where: { visitId: v.id, type: NotificationType.overstay_alert },
      });
      if (already > 0) continue;

      const visitorName = visitorDisplayName(v, 'A visitor');
      const recipientIds = [
        ...new Set([...(v.hostId ? [v.hostId] : []), ...security.map((s) => s.id)]),
      ];

      await this.prisma.notification.createMany({
        data: recipientIds.map((recipientId) => ({
          visitId: v.id,
          recipientId,
          type: NotificationType.overstay_alert,
          channel: NotificationChannel.in_app,
        })),
      });
      if (pushOn) {
        await Promise.all(
          recipientIds.map((rid) =>
            this.push.sendToUser(rid, {
              title: 'Overstay alert',
              body: `${visitorName} has been on-site more than ${hours}h.`,
              url: '/security/board',
            }),
          ),
        );
      }
      await this.audit.log({
        actorId: null,
        action: 'visit.overstay_flagged',
        targetType: 'visit',
        targetId: v.id,
        meta: { hours },
      });
      alerted += 1;
    }
    if (alerted) this.logger.log(`Overstay sweep: alerted ${alerted} of ${overdue.length} overdue visit(s).`);
  }

  /** End-of-day sweep (23:00): auto-close stragglers + expire no-show pre-regs. */
  @Cron('0 23 * * *')
  async endOfDaySweep(): Promise<{ autoClosed: number; noShows: number }> {
    const result = await this.runEndOfDaySweep();
    this.logger.log(`End-of-day sweep: auto-closed ${result.autoClosed}, expired ${result.noShows} no-show(s).`);
    return result;
  }

  /** The end-of-day work, callable directly (cron + manual admin trigger). */
  async runEndOfDaySweep(): Promise<{ autoClosed: number; noShows: number }> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1) Auto-close everyone still inside — marked auto, entry code released.
    const inside = await this.prisma.visit.findMany({
      where: { status: VisitStatus.checked_in },
      select: { id: true },
    });
    if (inside.length > 0) {
      await this.prisma.visit.updateMany({
        where: { status: VisitStatus.checked_in },
        data: {
          status: VisitStatus.checked_out,
          checkOutTime: new Date(),
          autoCheckedOut: true,
          entryCode: null,
        },
      });
      for (const v of inside) {
        await this.audit.log({
          actorId: null,
          action: 'visit.auto_checked_out',
          targetType: 'visit',
          targetId: v.id,
        });
      }
    }

    // 2) Expire no-show pre-registrations from a prior day; free their codes.
    const noShows = await this.prisma.visit.findMany({
      where: {
        status: VisitStatus.expected,
        OR: [
          { expectedTime: { lt: startOfToday } },
          { expectedTime: null, createdAt: { lt: startOfToday } },
        ],
      },
      select: { id: true },
    });
    if (noShows.length > 0) {
      await this.prisma.visit.updateMany({
        where: { id: { in: noShows.map((v) => v.id) } },
        data: { status: VisitStatus.no_show, entryCode: null },
      });
      for (const v of noShows) {
        await this.audit.log({
          actorId: null,
          action: 'visit.no_show',
          targetType: 'visit',
          targetId: v.id,
        });
      }
    }

    return { autoClosed: inside.length, noShows: noShows.length };
  }
}
