import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  NotificationChannel,
  NotificationType,
  Prisma,
  VisitStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OverridesService } from '../overrides/overrides.service';
import { VisitorsService } from '../visitors/visitors.service';
import { WorkingHoursService } from '../working-hours/working-hours.service';
import type { CheckInDto } from './dto/check-in.dto';

const boardInclude = {
  visitor: { select: { fullName: true, phone: true, photoUrl: true } },
  host: { select: { fullName: true } },
} satisfies Prisma.VisitInclude;

type VisitWithRefs = Prisma.VisitGetPayload<{ include: typeof boardInclude }>;

/** Denormalized board row (matches the web BoardVisit shape). */
export interface BoardVisit {
  id: string;
  visitorName: string;
  visitorPhone: string;
  photoUrl: string | null;
  hostName: string;
  purpose: string | null;
  status: VisitStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  badgeCode: string | null;
}

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visitors: VisitorsService,
    private readonly workingHours: WorkingHoursService,
    private readonly overrides: OverridesService,
    private readonly audit: AuditService,
  ) {}

  /** Today's visits + anyone still on site (PRD §4.3 board / §4.10 roll call). */
  async getToday(): Promise<BoardVisit[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const visits = await this.prisma.visit.findMany({
      where: {
        OR: [{ createdAt: { gte: startOfDay } }, { status: VisitStatus.checked_in }],
      },
      include: boardInclude,
      orderBy: { createdAt: 'desc' },
    });
    return visits.map((v) => this.toBoard(v));
  }

  /** Walk-in / pre-registered check-in with all gates (PRD §4.1, §4.7, §4.8, §4.11). */
  async checkIn(dto: CheckInDto, actorId: string): Promise<BoardVisit> {
    await this.visitors.findById(dto.visitorId); // 404 if missing
    const host = await this.prisma.user.findUnique({ where: { id: dto.hostId } });
    if (!host) throw new NotFoundException('Host not found.');

    const check = await this.visitors.securityCheck(dto.visitorId, dto.hostId);

    // §4.7 — blocked: record a denied visit, audit, deny silently.
    if (check.blocked) {
      const denied = await this.prisma.visit.create({
        data: {
          visitorId: dto.visitorId,
          hostId: dto.hostId,
          purpose: dto.purpose?.trim() || null,
          status: VisitStatus.denied,
          checkedInById: actorId,
        },
      });
      await this.audit.log({
        actorId,
        action: 'visit.denied',
        targetType: 'visit',
        targetId: denied.id,
        meta: { reason: 'blocklist' },
      });
      throw new ForbiddenException('This visitor cannot be checked in.');
    }

    // §4.11 — host restriction: neutral refusal, no visit created.
    if (check.hostRestricted) {
      await this.audit.log({
        actorId,
        action: 'visit.restricted_attempt',
        targetType: 'visitor',
        targetId: dto.visitorId,
        meta: { hostId: dto.hostId },
      });
      throw new ConflictException(
        'This host is not accepting this visitor. Please select another host or contact an administrator.',
      );
    }

    // §4.8 — working hours: closed requires a real, approved override request.
    const open = await this.workingHours.isOpenAt(new Date());
    let overrideId: string | null = null;
    let overrideApprovedById: string | null = null;
    if (!open) {
      if (!dto.overrideRequestId) {
        throw new UnprocessableEntityException(
          'Outside working hours — a supervisor override is required.',
        );
      }
      const approved = await this.overrides.getApprovedForCheckIn(
        dto.overrideRequestId,
        dto.visitorId,
        dto.hostId,
      );
      overrideId = approved.id;
      overrideApprovedById = approved.resolvedById;
    }

    const visit = await this.prisma.visit.create({
      data: {
        visitorId: dto.visitorId,
        hostId: dto.hostId,
        purpose: dto.purpose?.trim() || null,
        status: VisitStatus.checked_in,
        checkInTime: new Date(),
        checkedInById: actorId,
        badgeCode: this.generateBadgeCode(),
        isOverride: Boolean(overrideId),
        overrideApprovedById,
      },
      include: boardInclude,
    });

    // Consume the override (one-time use) now that the visit exists.
    if (overrideId) await this.overrides.markConsumed(overrideId, visit.id);

    await this.audit.log({
      actorId,
      action: 'visitor.checked_in',
      targetType: 'visit',
      targetId: visit.id,
      meta: { hostId: dto.hostId, isOverride: Boolean(overrideId) },
    });

    // §4.5 — notify the host of arrival.
    await this.prisma.notification.create({
      data: {
        visitId: visit.id,
        recipientId: dto.hostId,
        type: NotificationType.arrival_alert,
        channel: NotificationChannel.in_app,
      },
    });

    return this.toBoard(visit);
  }

  /** Check-out (PRD §4.3). */
  async checkOut(id: string, actorId: string): Promise<BoardVisit> {
    const visit = await this.prisma.visit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visit not found.');
    if (visit.status !== VisitStatus.checked_in) {
      throw new ConflictException('Visit is not currently checked in.');
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: { status: VisitStatus.checked_out, checkOutTime: new Date(), checkedOutById: actorId },
      include: boardInclude,
    });
    await this.audit.log({
      actorId,
      action: 'visitor.checked_out',
      targetType: 'visit',
      targetId: id,
    });
    return this.toBoard(updated);
  }

  // --- helpers ---------------------------------------------------------------

  private toBoard(v: VisitWithRefs): BoardVisit {
    return {
      id: v.id,
      visitorName: v.visitor.fullName,
      visitorPhone: v.visitor.phone,
      photoUrl: v.visitor.photoUrl,
      hostName: v.host.fullName,
      purpose: v.purpose,
      status: v.status,
      checkInTime: v.checkInTime?.toISOString() ?? null,
      checkOutTime: v.checkOutTime?.toISOString() ?? null,
      expectedTime: v.expectedTime?.toISOString() ?? null,
      badgeCode: v.badgeCode,
    };
  }

  private generateBadgeCode(): string {
    return `ENT-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  }
}
