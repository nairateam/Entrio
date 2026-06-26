import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationChannel, NotificationType, Prisma, VisitStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { visitorDisplayName } from '../../common/visit-name';
import { PushService } from '../../integrations/web-push/push.service';
import { EmailService } from '../../integrations/email/email.service';
import { preRegisterEmail } from '../../integrations/email/email.templates';
import { allocateEntryCode } from '../../common/entry-code';
import { paginated, type PageArgs, type Paginated } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';
import type { AddRestrictionDto } from './dto/add-restriction.dto';
import type { PreRegisterDto } from './dto/pre-register.dto';

const visitInclude = {
  visitor: { select: { fullName: true, phone: true, email: true, photoUrl: true } },
} satisfies Prisma.VisitInclude;
type VisitWithVisitor = Prisma.VisitGetPayload<{ include: typeof visitInclude }>;

const restrictionInclude = {
  visitor: { select: { fullName: true, phone: true } },
} satisfies Prisma.HostVisitorRestrictionInclude;
type RestrictionWithVisitor = Prisma.HostVisitorRestrictionGetPayload<{
  include: typeof restrictionInclude;
}>;

/** Denormalized visit for the host dashboard (matches the web HostVisit shape). */
export interface HostVisitView {
  id: string;
  hostId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string | null;
  photoUrl: string | null;
  purpose: string | null;
  status: VisitStatus;
  expectedTime: string | null;
  checkInTime: string | null;
  hostOnWay: boolean;
  /** Typed entry code for self-service check-in (PRD v2 §3.2); null for walk-ins. */
  entryCode: string | null;
}

export interface HostRestrictionView {
  id: string;
  visitorName: string;
  visitorPhone: string;
  reason: string;
  createdAt: string;
  isActive: boolean;
}

@Injectable()
export class HostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly push: PushService,
    private readonly email: EmailService,
  ) {}

  /** Active host users, for the check-in host picker (PRD §4.1.6). */
  listHosts() {
    return this.prisma.user.findMany({
      where: { role: 'host', isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async listMyVisits(hostId: string): Promise<HostVisitView[]> {
    const visits = await this.prisma.visit.findMany({
      where: { hostId },
      include: visitInclude,
      orderBy: { createdAt: 'desc' },
    });
    return visits.map((v) => this.toVisitView(v));
  }

  /** Paginated + searchable view of a host's own visits (the My Visitors table). */
  async listMyVisitsPaged(
    hostId: string,
    args: PageArgs,
    opts: { search?: string; status?: string } = {},
  ): Promise<Paginated<HostVisitView>> {
    const q = opts.search?.trim();
    const statusFilter =
      opts.status && (Object.values(VisitStatus) as string[]).includes(opts.status)
        ? (opts.status as VisitStatus)
        : undefined;

    const where: Prisma.VisitWhereInput = {
      AND: [
        { hostId },
        ...(statusFilter ? [{ status: statusFilter }] : []),
        ...(q
          ? [
              {
                OR: [
                  { visitor: { fullName: { contains: q, mode: 'insensitive' as const } } },
                  { visitor: { phone: { contains: q } } },
                ],
              },
            ]
          : []),
      ],
    };

    const [visits, total] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        where,
        include: visitInclude,
        orderBy: { createdAt: 'desc' },
        skip: args.skip,
        take: args.take,
      }),
      this.prisma.visit.count({ where }),
    ]);
    return paginated(
      visits.map((v) => this.toVisitView(v)),
      total,
      args,
    );
  }

  /** Pre-register a visitor for a future visit (PRD §4.4) — status `expected`. */
  async preRegister(hostId: string, dto: PreRegisterDto): Promise<HostVisitView> {
    const visitor = await this.upsertVisitor(dto.visitorName, dto.visitorPhone, dto.visitorEmail);
    const expectedTime = new Date(`${dto.expectedDate}T${dto.expectedTime}:00`);
    const entryCode = await allocateEntryCode(this.prisma);

    const visit = await this.prisma.visit.create({
      data: {
        visitorId: visitor.id,
        hostId,
        purpose: dto.purpose?.trim() || null,
        status: VisitStatus.expected,
        expectedTime,
        entryCode,
      },
      include: visitInclude,
    });
    await this.audit.log({
      actorId: hostId,
      action: 'visit.pre_registered',
      targetType: 'visit',
      targetId: visit.id,
      meta: { expectedTime: expectedTime.toISOString(), entryCode },
    });

    // Email the visitor their check-in code (best-effort — never blocks scheduling).
    if (visitor.email) {
      await this.sendCodeEmail({
        to: visitor.email,
        visitorName: visitor.fullName,
        hostId,
        code: entryCode,
        expectedTime,
      });
    }

    return this.toVisitView(visit);
  }

  /** Email a pre-registered visitor their check-in code. Failures are logged, not thrown. */
  private async sendCodeEmail(args: {
    to: string;
    visitorName: string;
    hostId: string;
    code: string;
    expectedTime: Date;
  }): Promise<void> {
    const host = await this.prisma.user.findUnique({
      where: { id: args.hostId },
      select: { fullName: true },
    });
    const when = args.expectedTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const { subject, html } = preRegisterEmail({
      visitorName: args.visitorName,
      hostName: host?.fullName ?? 'Your host',
      code: args.code,
      when,
    });
    await this.email.send({ to: args.to, subject, html });
  }

  /** Host responds "On My Way" after a visitor arrives (PRD §4.5). */
  async markOnMyWay(visitId: string, hostId: string): Promise<HostVisitView> {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Visit not found.');
    if (visit.hostId !== hostId) throw new ForbiddenException('This visit is not yours.');

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { hostOnWay: true },
      include: visitInclude,
    });
    await this.audit.log({
      actorId: hostId,
      action: 'visit.host_on_way',
      targetType: 'visit',
      targetId: visitId,
    });
    return this.toVisitView(updated);
  }

  /**
   * Host replies to the front desk about a visit (PRD §4.5). Notifies the
   * security user who checked the visitor in, or — if there isn't one yet — every
   * active security user. Delivered to the in-app bell + a Web Push.
   */
  async respondToVisit(
    visitId: string,
    hostId: string,
    message: string,
  ): Promise<{ recipients: number }> {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        visitor: { select: { fullName: true } },
        host: { select: { fullName: true } },
      },
    });
    if (!visit) throw new NotFoundException('Visit not found.');
    if (visit.hostId !== hostId) throw new ForbiddenException('This visit is not yours.');

    const body = message.trim();

    let recipientIds: string[];
    if (visit.checkedInById) {
      recipientIds = [visit.checkedInById];
    } else {
      const security = await this.prisma.user.findMany({
        where: { role: 'security', isActive: true },
        select: { id: true },
      });
      recipientIds = security.map((u) => u.id);
    }

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.prisma.notification.create({
          data: {
            visitId,
            recipientId,
            type: NotificationType.host_response,
            channel: NotificationChannel.in_app,
            message: body,
          },
        }),
      ),
    );

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.push.sendToUser(recipientId, {
          title: `${visit.host.fullName} replied`,
          body: `Re ${visitorDisplayName(visit, 'the visitor')}: ${body}`,
          url: '/security/board',
        }),
      ),
    );

    await this.audit.log({
      actorId: hostId,
      action: 'visit.host_responded',
      targetType: 'visit',
      targetId: visitId,
      meta: { recipients: recipientIds.length },
    });

    return { recipients: recipientIds.length };
  }

  // --- host restrictions (PRD §4.11) ---------------------------------------

  async listRestrictions(hostId: string): Promise<HostRestrictionView[]> {
    const rows = await this.prisma.hostVisitorRestriction.findMany({
      where: { hostId, isActive: true },
      include: restrictionInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toRestrictionView(r));
  }

  async addRestriction(hostId: string, dto: AddRestrictionDto): Promise<HostRestrictionView> {
    const visitor = await this.upsertVisitor(dto.visitorName, dto.visitorPhone);
    const restriction = await this.prisma.hostVisitorRestriction.upsert({
      where: { hostId_visitorId: { hostId, visitorId: visitor.id } },
      update: { isActive: true, reason: dto.reason.trim() },
      create: { hostId, visitorId: visitor.id, reason: dto.reason.trim() },
      include: restrictionInclude,
    });
    await this.audit.log({
      actorId: hostId,
      action: 'restriction.created',
      targetType: 'host_visitor_restriction',
      targetId: restriction.id,
      meta: { visitorId: visitor.id },
    });
    return this.toRestrictionView(restriction);
  }

  async liftRestriction(id: string, hostId: string): Promise<void> {
    const restriction = await this.prisma.hostVisitorRestriction.findUnique({ where: { id } });
    if (!restriction) throw new NotFoundException('Restriction not found.');
    if (restriction.hostId !== hostId) throw new ForbiddenException('This restriction is not yours.');

    await this.prisma.hostVisitorRestriction.update({ where: { id }, data: { isActive: false } });
    await this.audit.log({
      actorId: hostId,
      action: 'restriction.lifted',
      targetType: 'host_visitor_restriction',
      targetId: id,
    });
  }

  // --- helpers ---------------------------------------------------------------

  private upsertVisitor(fullName: string, phone: string, email?: string) {
    const name = fullName.trim();
    const tel = phone.trim();
    return this.prisma.visitor.upsert({
      where: { fullName_phone: { fullName: name, phone: tel } },
      update: email ? { email: email.trim() } : {},
      create: { fullName: name, phone: tel, email: email?.trim() || null },
    });
  }

  private toVisitView(v: VisitWithVisitor): HostVisitView {
    return {
      id: v.id,
      hostId: v.hostId,
      // Self-service walk-ins keep their details on the visit, with no Visitor row.
      visitorName: visitorDisplayName(v),
      visitorPhone: v.visitor?.phone ?? v.visitorPhone ?? '',
      visitorEmail: v.visitor?.email ?? v.visitorEmail ?? null,
      photoUrl: v.visitor?.photoUrl ?? v.photoUrl,
      purpose: v.purpose,
      status: v.status,
      expectedTime: v.expectedTime?.toISOString() ?? null,
      checkInTime: v.checkInTime?.toISOString() ?? null,
      hostOnWay: v.hostOnWay,
      entryCode: v.entryCode,
    };
  }

  private toRestrictionView(r: RestrictionWithVisitor): HostRestrictionView {
    return {
      id: r.id,
      visitorName: r.visitor.fullName,
      visitorPhone: r.visitor.phone,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      isActive: r.isActive,
    };
  }
}
