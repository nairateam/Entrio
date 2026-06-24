import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const actorSelect = {
  blockedBy: { select: { fullName: true } },
  flaggedBy: { select: { fullName: true } },
} satisfies Prisma.VisitorInclude;
type VisitorWithActors = Prisma.VisitorGetPayload<{ include: typeof actorSelect }>;

/** Denormalized visitor for admin block/flag management (web AdminVisitor shape). */
export interface AdminVisitorView {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  blockedByName: string | null;
  blockedAt: string | null;
  isFlagged: boolean;
  flagNote: string | null;
  flaggedByName: string | null;
  flaggedAt: string | null;
}

@Injectable()
export class BlocklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listBlocked(): Promise<AdminVisitorView[]> {
    const rows = await this.prisma.visitor.findMany({
      where: { isBlocked: true },
      include: actorSelect,
      orderBy: { blockedAt: 'desc' },
    });
    return rows.map((v) => this.toView(v));
  }

  async listFlagged(): Promise<AdminVisitorView[]> {
    const rows = await this.prisma.visitor.findMany({
      where: { isFlagged: true },
      include: actorSelect,
      orderBy: { flaggedAt: 'desc' },
    });
    return rows.map((v) => this.toView(v));
  }

  /** Building-wide block (PRD §4.7/§4.12). Escalating a flag also clears it. */
  async block(visitorId: string, reason: string, actorId: string): Promise<AdminVisitorView> {
    const visitor = await this.requireVisitor(visitorId);
    if (visitor.isBlocked) throw new ConflictException('Visitor is already blocked.');

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: {
        isBlocked: true,
        blockReason: reason.trim(),
        blockedById: actorId,
        blockedAt: new Date(),
        // Blocking supersedes a review flag.
        isFlagged: false,
        flagNote: null,
        flaggedById: null,
        flaggedAt: null,
      },
      include: actorSelect,
    });
    await this.audit.log({
      actorId,
      action: 'visitor.blocked',
      targetType: 'visitor',
      targetId: visitorId,
      meta: { reason: reason.trim() },
    });
    return this.toView(updated);
  }

  async unblock(visitorId: string, actorId: string): Promise<AdminVisitorView> {
    const visitor = await this.requireVisitor(visitorId);
    if (!visitor.isBlocked) throw new ConflictException('Visitor is not blocked.');

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: { isBlocked: false, blockReason: null, blockedById: null, blockedAt: null },
      include: actorSelect,
    });
    await this.audit.log({
      actorId,
      action: 'visitor.unblocked',
      targetType: 'visitor',
      targetId: visitorId,
    });
    return this.toView(updated);
  }

  /** Resolve a review flag without blocking (PRD §4.12). */
  async clearFlag(visitorId: string, actorId: string): Promise<AdminVisitorView> {
    const visitor = await this.requireVisitor(visitorId);
    if (!visitor.isFlagged) throw new ConflictException('Visitor is not flagged.');

    const updated = await this.prisma.visitor.update({
      where: { id: visitorId },
      data: { isFlagged: false, flagNote: null, flaggedById: null, flaggedAt: null },
      include: actorSelect,
    });
    await this.audit.log({
      actorId,
      action: 'visitor.flag_cleared',
      targetType: 'visitor',
      targetId: visitorId,
    });
    return this.toView(updated);
  }

  // --- helpers ---------------------------------------------------------------

  private async requireVisitor(id: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found.');
    return visitor;
  }

  private toView(v: VisitorWithActors): AdminVisitorView {
    return {
      id: v.id,
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      photoUrl: v.photoUrl,
      isBlocked: v.isBlocked,
      blockReason: v.blockReason,
      blockedByName: v.blockedBy?.fullName ?? null,
      blockedAt: v.blockedAt?.toISOString() ?? null,
      isFlagged: v.isFlagged,
      flagNote: v.flagNote,
      flaggedByName: v.flaggedBy?.fullName ?? null,
      flaggedAt: v.flaggedAt?.toISOString() ?? null,
    };
  }
}
