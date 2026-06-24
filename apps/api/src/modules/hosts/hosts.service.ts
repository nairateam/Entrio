import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VisitStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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
  ) {}

  async listMyVisits(hostId: string): Promise<HostVisitView[]> {
    const visits = await this.prisma.visit.findMany({
      where: { hostId },
      include: visitInclude,
      orderBy: { createdAt: 'desc' },
    });
    return visits.map((v) => this.toVisitView(v));
  }

  /** Pre-register a visitor for a future visit (PRD §4.4) — status `expected`. */
  async preRegister(hostId: string, dto: PreRegisterDto): Promise<HostVisitView> {
    const visitor = await this.upsertVisitor(dto.visitorName, dto.visitorPhone, dto.visitorEmail);
    const expectedTime = new Date(`${dto.expectedDate}T${dto.expectedTime}:00`);

    const visit = await this.prisma.visit.create({
      data: {
        visitorId: visitor.id,
        hostId,
        purpose: dto.purpose?.trim() || null,
        status: VisitStatus.expected,
        expectedTime,
      },
      include: visitInclude,
    });
    await this.audit.log({
      actorId: hostId,
      action: 'visit.pre_registered',
      targetType: 'visit',
      targetId: visit.id,
      meta: { expectedTime: expectedTime.toISOString() },
    });
    return this.toVisitView(visit);
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
      visitorName: v.visitor.fullName,
      visitorPhone: v.visitor.phone,
      visitorEmail: v.visitor.email,
      photoUrl: v.visitor.photoUrl,
      purpose: v.purpose,
      status: v.status,
      expectedTime: v.expectedTime?.toISOString() ?? null,
      checkInTime: v.checkInTime?.toISOString() ?? null,
      hostOnWay: v.hostOnWay,
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
