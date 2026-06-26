import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  NotificationChannel,
  NotificationType,
  Prisma,
  UserRole,
  VisitStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { visitorDisplayName } from '../../common/visit-name';
import { paginated, type PageArgs, type Paginated } from '../../common/pagination';
import { allocateEntryCode, normalizeEntryCode } from '../../common/entry-code';
import { CloudinaryService } from '../../integrations/cloudinary/cloudinary.service';
import { PushService } from '../../integrations/web-push/push.service';
import { AuditService } from '../audit/audit.service';
import { OverridesService } from '../overrides/overrides.service';
import { SettingsService } from '../settings/settings.service';
import { VisitorsService } from '../visitors/visitors.service';
import { WorkingHoursService } from '../working-hours/working-hours.service';
import type { CheckInDto } from './dto/check-in.dto';

const boardInclude = {
  visitor: { select: { fullName: true, phone: true, photoUrl: true } },
  host: { select: { fullName: true } },
} satisfies Prisma.VisitInclude;

type VisitWithRefs = Prisma.VisitGetPayload<{ include: typeof boardInclude }>;

const detailInclude = {
  visitor: { select: { fullName: true, phone: true, email: true, photoUrl: true } },
  host: { select: { fullName: true } },
} satisfies Prisma.VisitInclude;

/** Denormalized board row (matches the web BoardVisit shape). */
export interface BoardVisit {
  id: string;
  visitorId: string | null;
  visitorName: string;
  visitorPhone: string;
  photoUrl: string | null;
  hostName: string;
  purpose: string | null;
  status: VisitStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  /** The host's latest reply to the front desk about this visit, if any (§4.5). */
  hostResponse: string | null;
}

/** Full visit record for the detail drawer — adds media + consent + contact. */
export interface VisitDetail extends BoardVisit {
  visitorEmail: string | null;
  entryCode: string | null;
  signatureUrl: string | null;
  consentAcceptedAt: string | null;
  consentVersion: string | null;
  autoCheckedOut: boolean;
}

/** Why a silent self-service gate (PRD v2 §3.2) refused entry. */
export type EntryGateReason = 'blocklist' | 'host_restriction' | 'after_hours';

export interface EntryGateResult {
  ok: boolean;
  reason?: EntryGateReason;
}

/** Staff-facing labels for the real exception reason (never shown to the visitor). */
const REASON_LABEL: Record<EntryGateReason, string> = {
  blocklist: 'blocked visitor',
  host_restriction: 'host restriction',
  after_hours: 'outside working hours',
};

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visitors: VisitorsService,
    private readonly workingHours: WorkingHoursService,
    private readonly overrides: OverridesService,
    private readonly audit: AuditService,
    private readonly cloudinary: CloudinaryService,
    private readonly push: PushService,
    private readonly settings: SettingsService,
  ) {}

  /** Full detail for one visit (the detail drawer) — incl. photo + signature. */
  async getDetail(id: string): Promise<VisitDetail> {
    const v = await this.prisma.visit.findUnique({ where: { id }, include: detailInclude });
    if (!v) throw new NotFoundException('Visit not found.');

    const resp = await this.prisma.notification.findFirst({
      where: { visitId: id, type: NotificationType.host_response, message: { not: null } },
      orderBy: { sentAt: 'desc' },
      select: { message: true },
    });

    return {
      id: v.id,
      visitorId: v.visitorId,
      visitorName: visitorDisplayName(v),
      visitorPhone: v.visitor?.phone ?? v.visitorPhone ?? '',
      visitorEmail: v.visitor?.email ?? v.visitorEmail ?? null,
      hostName: v.host.fullName,
      purpose: v.purpose,
      status: v.status,
      entryCode: v.entryCode,
      checkInTime: v.checkInTime?.toISOString() ?? null,
      checkOutTime: v.checkOutTime?.toISOString() ?? null,
      expectedTime: v.expectedTime?.toISOString() ?? null,
      photoUrl: v.visitor?.photoUrl ?? v.photoUrl,
      signatureUrl: v.signatureUrl,
      consentAcceptedAt: v.consentAcceptedAt?.toISOString() ?? null,
      consentVersion: v.consentVersion,
      autoCheckedOut: v.autoCheckedOut,
      hostResponse: resp?.message ?? null,
    };
  }

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
    return this.toBoardList(visits);
  }

  /**
   * Paginated visitations within an inclusive date range — the visitations log.
   * `from` defaults to today; `to` defaults to `from` (a single day). A visit
   * matches if its created, check-in, or expected time falls in the range, and
   * (optionally) the search text and status filter.
   */
  async getInRange(params: {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
    args: PageArgs;
  }): Promise<Paginated<BoardVisit>> {
    const { from, to, search, status, args } = params;

    const start = from ? new Date(`${from}T00:00:00`) : new Date();
    start.setHours(0, 0, 0, 0);
    const endBase = to ? new Date(`${to}T00:00:00`) : new Date(start);
    endBase.setHours(0, 0, 0, 0);
    const end = new Date(endBase);
    end.setDate(end.getDate() + 1); // make `to` inclusive

    const q = search?.trim();
    const statusFilter =
      status && (Object.values(VisitStatus) as string[]).includes(status)
        ? (status as VisitStatus)
        : undefined;

    const where: Prisma.VisitWhereInput = {
      AND: [
        {
          OR: [
            { createdAt: { gte: start, lt: end } },
            { checkInTime: { gte: start, lt: end } },
            { expectedTime: { gte: start, lt: end } },
          ],
        },
        ...(statusFilter ? [{ status: statusFilter }] : []),
        ...(q
          ? [
              {
                OR: [
                  { visitor: { fullName: { contains: q, mode: 'insensitive' as const } } },
                  { visitor: { phone: { contains: q } } },
                  { visitorName: { contains: q, mode: 'insensitive' as const } },
                  { visitorPhone: { contains: q } },
                  { host: { fullName: { contains: q, mode: 'insensitive' as const } } },
                ],
              },
            ]
          : []),
      ],
    };

    const [visits, total] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        where,
        include: boardInclude,
        orderBy: { createdAt: 'desc' },
        skip: args.skip,
        take: args.take,
      }),
      this.prisma.visit.count({ where }),
    ]);

    return paginated(await this.toBoardList(visits), total, args);
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
          'Outside working hours — an admin override is required.',
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

    // §4.1.7 — a newly captured headshot is uploaded to Cloudinary and saved as the
    // visitor's photo. Done before the visit row so boardInclude returns the new URL.
    // Skipped silently if Cloudinary isn't configured or the upload fails.
    if (dto.headshot) {
      const url = await this.cloudinary.uploadHeadshot(dto.headshot, dto.visitorId);
      if (url) {
        await this.prisma.visitor.update({
          where: { id: dto.visitorId },
          data: { photoUrl: url },
        });
      }
    }

    const visitData = {
      visitorId: dto.visitorId,
      hostId: dto.hostId,
      purpose: dto.purpose?.trim() || null,
      status: VisitStatus.checked_in,
      checkInTime: new Date(),
      checkedInById: actorId,
      isOverride: Boolean(overrideId),
      overrideApprovedById,
    };

    // §4.2 — pre-registered "faster path": fulfill the existing `expected` visit in
    // place instead of creating a duplicate. Falls back to a fresh walk-in row if the
    // id is stale / already consumed / for a different visitor.
    const expected = dto.expectedVisitId
      ? await this.prisma.visit.findUnique({ where: { id: dto.expectedVisitId } })
      : null;
    const fromExpected =
      !!expected && expected.status === VisitStatus.expected && expected.visitorId === dto.visitorId;

    const visit = fromExpected
      ? await this.prisma.visit.update({
          where: { id: expected!.id },
          data: visitData,
          include: boardInclude,
        })
      : await this.prisma.visit.create({ data: visitData, include: boardInclude });

    // Consume the override (one-time use) now that the visit exists.
    if (overrideId) await this.overrides.markConsumed(overrideId, visit.id);

    await this.audit.log({
      actorId,
      action: 'visitor.checked_in',
      targetType: 'visit',
      targetId: visit.id,
      meta: { hostId: dto.hostId, isOverride: Boolean(overrideId), fromExpected },
    });

    // §4.5 — notify the host of arrival (in-app bell row).
    await this.prisma.notification.create({
      data: {
        visitId: visit.id,
        recipientId: dto.hostId,
        type: NotificationType.arrival_alert,
        channel: NotificationChannel.in_app,
      },
    });

    // §4.5 — also deliver a browser push when push notifications are enabled.
    if (this.settings.get().pushNotifications) {
      await this.push.sendToUser(dto.hostId, {
        title: 'Visitor arrived',
        body: `${visitorDisplayName(visit, 'A visitor')} is here to see you.`,
        url: '/host',
      });
    }

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
      // Release the entry code so its 4-digit value can be reused.
      data: { status: VisitStatus.checked_out, checkOutTime: new Date(), checkedOutById: actorId, entryCode: null },
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

  // --- self-service (PRD v2) -------------------------------------------------

  /**
   * Evaluate the silent self-service gates (PRD v2 §3.2) in order, WITHOUT
   * throwing — the kiosk needs a neutral yes/no plus the real reason for staff.
   */
  async evaluateEntryGates(visitorId: string, hostId: string): Promise<EntryGateResult> {
    const check = await this.visitors.securityCheck(visitorId, hostId);
    if (check.blocked) return { ok: false, reason: 'blocklist' };
    if (check.hostRestricted) return { ok: false, reason: 'host_restriction' };
    return this.evaluateWorkingHours();
  }

  /**
   * Working-hours-only gate (PRD v2 §3.2). Used for walk-ins, which have no
   * persistent visitor identity to check against the blocklist/restriction list.
   */
  async evaluateWorkingHours(): Promise<EntryGateResult> {
    const open = await this.workingHours.isOpenAt(new Date());
    return open ? { ok: true } : { ok: false, reason: 'after_hours' };
  }

  /**
   * Self-service check-in (gates already passed). A pre-registered visit is
   * fulfilled in place (keeps its Visitor + code); a walk-in creates a fresh,
   * self-contained visit with the captured details inline and NO Visitor record
   * (PRD v2 — every clock-in is its own log entry). Stores the headshot + drawn
   * signature on the visit, then notifies the host. No human operator.
   */
  async selfServiceCheckIn(params: {
    visitorId?: string | null;
    expectedVisitId?: string | null;
    hostId: string;
    purpose?: string | null;
    visitorName?: string | null;
    visitorPhone?: string | null;
    visitorEmail?: string | null;
    headshot?: string | null;
    signature?: string | null;
    consentVersion: string;
    deviceId: string;
  }): Promise<{ visit: BoardVisit; entryCode: string }> {
    const { hostId, deviceId } = params;

    const expected = params.expectedVisitId
      ? await this.prisma.visit.findUnique({ where: { id: params.expectedVisitId } })
      : null;
    const fromExpected = !!expected && expected.status === VisitStatus.expected;

    // Reuse a pre-registered code; otherwise mint one so walk-ins can self check-out.
    const entryCode = fromExpected && expected!.entryCode ? expected!.entryCode : await allocateEntryCode(this.prisma);

    // Captured media: upload when Cloudinary is configured, else keep the data URL (dev).
    const photoUrl = params.headshot
      ? ((await this.cloudinary.uploadHeadshot(params.headshot, entryCode)) ?? params.headshot)
      : null;
    const signatureUrl = params.signature
      ? ((await this.cloudinary.uploadSignature(params.signature, `${entryCode}-sig`)) ?? params.signature)
      : null;

    const visitData = {
      visitorId: params.visitorId ?? null,
      hostId,
      purpose: params.purpose?.trim() || null,
      status: VisitStatus.checked_in,
      entryCode,
      visitorName: params.visitorName?.trim() || null,
      visitorPhone: params.visitorPhone?.trim() || null,
      visitorEmail: params.visitorEmail?.trim() || null,
      photoUrl,
      signatureUrl,
      checkInTime: new Date(),
      consentAcceptedAt: new Date(),
      consentVersion: params.consentVersion,
    };

    const visit = fromExpected
      ? await this.prisma.visit.update({ where: { id: expected!.id }, data: visitData, include: boardInclude })
      : await this.prisma.visit.create({ data: visitData, include: boardInclude });

    await this.audit.log({
      actorId: null,
      action: 'visitor.self_checked_in',
      targetType: 'visit',
      targetId: visit.id,
      meta: { deviceId, hostId, fromExpected },
    });

    // Notify the host (in-app bell + optional push), same as the staff flow.
    const name = visitorDisplayName(visit, 'A visitor');
    await this.prisma.notification.create({
      data: {
        visitId: visit.id,
        recipientId: hostId,
        type: NotificationType.arrival_alert,
        channel: NotificationChannel.in_app,
      },
    });
    if (this.settings.get().pushNotifications) {
      await this.push.sendToUser(hostId, {
        title: 'Visitor arrived',
        body: `${name} is here to see you.`,
        url: '/host',
      });
    }

    return { visit: this.toBoard(visit), entryCode };
  }

  /**
   * A self-service attempt that failed a gate (PRD v2 §3.2 / §8b). Records a
   * `denied` visit for the audit trail and fires a real-reason exception alert to
   * every active Security/Admin so staff knows before the visitor reaches the desk.
   * The visitor only ever sees the neutral "see the front desk" message.
   */
  async recordSelfServiceException(params: {
    visitorId?: string | null;
    hostId: string;
    purpose?: string | null;
    visitorName?: string | null;
    visitorPhone?: string | null;
    reason: EntryGateReason;
    deviceId: string;
  }): Promise<void> {
    const { hostId, reason, deviceId } = params;

    const denied = await this.prisma.visit.create({
      data: {
        visitorId: params.visitorId ?? null,
        hostId,
        purpose: params.purpose?.trim() || null,
        status: VisitStatus.denied,
        visitorName: params.visitorName?.trim() || null,
        visitorPhone: params.visitorPhone?.trim() || null,
      },
      include: boardInclude,
    });

    await this.audit.log({
      actorId: null,
      action: 'visit.self_service_exception',
      targetType: 'visit',
      targetId: denied.id,
      meta: { deviceId, reason, hostId },
    });

    const staff = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.security, UserRole.admin] }, isActive: true },
      select: { id: true },
    });
    const visitorName = visitorDisplayName(denied, 'A visitor');
    const message = `Self-service check-in blocked (${REASON_LABEL[reason]}): ${visitorName} → ${denied.host.fullName}.`;

    await this.prisma.notification.createMany({
      data: staff.map((u) => ({
        visitId: denied.id,
        recipientId: u.id,
        type: NotificationType.self_service_exception,
        channel: NotificationChannel.in_app,
        message,
      })),
    });
    if (this.settings.get().pushNotifications) {
      await Promise.all(
        staff.map((u) =>
          this.push.sendToUser(u.id, {
            title: 'Front-desk attention needed',
            body: message,
            url: '/security',
          }),
        ),
      );
    }
  }

  /** Self-service check-out — no operator, so `checkedOutById` stays null. */
  async selfServiceCheckOut(id: string, deviceId: string): Promise<BoardVisit> {
    const visit = await this.prisma.visit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visit not found.');
    if (visit.status !== VisitStatus.checked_in) {
      throw new ConflictException('Visit is not currently checked in.');
    }
    const updated = await this.prisma.visit.update({
      where: { id },
      data: { status: VisitStatus.checked_out, checkOutTime: new Date(), entryCode: null },
      include: boardInclude,
    });
    await this.audit.log({
      actorId: null,
      action: 'visitor.self_checked_out',
      targetType: 'visit',
      targetId: id,
      meta: { deviceId },
    });
    return this.toBoard(updated);
  }

  /** Look up a pending `expected` visit by its typed entry code (pre-reg check-in). */
  async findExpectedByCode(code: string): Promise<BoardVisit> {
    const visit = await this.prisma.visit.findUnique({
      where: { entryCode: normalizeEntryCode(code) },
      include: boardInclude,
    });
    if (!visit || visit.status !== VisitStatus.expected) {
      throw new NotFoundException('No pending visit found for that code.');
    }
    return this.toBoard(visit);
  }

  /** Look up the current checked_in visit by entry code (self check-out). */
  async findActiveByCode(code: string): Promise<BoardVisit> {
    const visit = await this.prisma.visit.findUnique({
      where: { entryCode: normalizeEntryCode(code) },
      include: boardInclude,
    });
    if (!visit || visit.status !== VisitStatus.checked_in) {
      throw new NotFoundException('No active visit found for that code.');
    }
    return this.toBoard(visit);
  }

  // --- helpers ---------------------------------------------------------------

  /** Map visits to board rows, attaching each one's latest host reply in one query. */
  private async toBoardList(visits: VisitWithRefs[]): Promise<BoardVisit[]> {
    if (visits.length === 0) return [];

    const responses = await this.prisma.notification.findMany({
      where: {
        visitId: { in: visits.map((v) => v.id) },
        type: NotificationType.host_response,
      },
      orderBy: { sentAt: 'desc' },
      select: { visitId: true, message: true },
    });
    const latestResponse = new Map<string, string>();
    for (const r of responses) {
      if (r.message && !latestResponse.has(r.visitId)) latestResponse.set(r.visitId, r.message);
    }

    return visits.map((v) => this.toBoard(v, latestResponse.get(v.id) ?? null));
  }

  private toBoard(v: VisitWithRefs, hostResponse: string | null = null): BoardVisit {
    return {
      id: v.id,
      visitorId: v.visitorId,
      // Fall back to the visit's own captured details for self-service walk-ins.
      visitorName: visitorDisplayName(v),
      visitorPhone: v.visitor?.phone ?? v.visitorPhone ?? '',
      photoUrl: v.visitor?.photoUrl ?? v.photoUrl,
      hostName: v.host.fullName,
      purpose: v.purpose,
      status: v.status,
      checkInTime: v.checkInTime?.toISOString() ?? null,
      checkOutTime: v.checkOutTime?.toISOString() ?? null,
      expectedTime: v.expectedTime?.toISOString() ?? null,
      hostResponse,
    };
  }
}
