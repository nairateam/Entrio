import { Injectable, NotFoundException } from '@nestjs/common';
import type { Visitor } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateVisitorDto } from './dto/create-visitor.dto';

export interface VisitorSearchResult {
  visitor: Visitor;
  lastVisitAt: string | null;
}

export interface SecurityCheckResult {
  blocked: boolean;
  blockReason: string | null;
  hostRestricted: boolean;
}

@Injectable()
export class VisitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Search by name or phone — returns ALL matches with last-visit info (PRD §4.13). */
  async search(query: string): Promise<VisitorSearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    const visitors = await this.prisma.visitor.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      include: {
        visits: {
          where: { checkInTime: { not: null } },
          orderBy: { checkInTime: 'desc' },
          take: 1,
          select: { checkInTime: true },
        },
      },
      take: 25,
    });

    return visitors.map(({ visits, ...visitor }) => ({
      visitor,
      lastVisitAt: visits[0]?.checkInTime?.toISOString() ?? null,
    }));
  }

  async findById(id: string): Promise<Visitor> {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found.');
    return visitor;
  }

  async create(dto: CreateVisitorDto, actorId: string): Promise<Visitor> {
    const visitor = await this.prisma.visitor.create({
      data: { fullName: dto.fullName.trim(), phone: dto.phone.trim(), email: dto.email?.trim() || null },
    });
    await this.audit.log({
      actorId,
      action: 'visitor.created',
      targetType: 'visitor',
      targetId: visitor.id,
      meta: { fullName: visitor.fullName },
    });
    return visitor;
  }

  /** Flag for review — does not block entry (PRD §4.12). */
  async flag(id: string, note: string, actorId: string): Promise<Visitor> {
    await this.findById(id);
    const visitor = await this.prisma.visitor.update({
      where: { id },
      data: { isFlagged: true, flagNote: note.trim(), flaggedById: actorId, flaggedAt: new Date() },
    });
    await this.audit.log({
      actorId,
      action: 'visitor.flagged',
      targetType: 'visitor',
      targetId: id,
      meta: { note: note.trim() },
    });
    return visitor;
  }

  /** Combined blocklist (§4.7) + host-restriction (§4.11) gate. */
  async securityCheck(visitorId: string, hostId: string): Promise<SecurityCheckResult> {
    const visitor = await this.findById(visitorId);
    const restriction = await this.prisma.hostVisitorRestriction.findFirst({
      where: { hostId, visitorId, isActive: true },
    });
    return {
      blocked: visitor.isBlocked,
      blockReason: visitor.blockReason,
      hostRestricted: Boolean(restriction),
    };
  }
}
