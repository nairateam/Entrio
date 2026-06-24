import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OverrideRequest, OverrideStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestOverrideDto } from './dto/request-override.dto';

const overrideInclude = {
  visitor: { select: { fullName: true } },
  host: { select: { fullName: true } },
  requestedBy: { select: { fullName: true } },
  resolvedBy: { select: { fullName: true } },
} satisfies Prisma.OverrideRequestInclude;

type OverrideWithRefs = Prisma.OverrideRequestGetPayload<{ include: typeof overrideInclude }>;

/** Denormalized view (matches the web OverrideRequest shape). */
export interface OverrideRequestView {
  id: string;
  visitorName: string;
  hostName: string;
  requestedByName: string;
  reason: string;
  requestedAt: string;
  status: OverrideStatus;
  resolvedByName: string | null;
  resolvedAt: string | null;
}

@Injectable()
export class OverridesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Security requests an after-hours override (PRD §4.8). */
  async request(dto: RequestOverrideDto, actorId: string): Promise<OverrideRequestView> {
    const visitor = await this.prisma.visitor.findUnique({ where: { id: dto.visitorId } });
    if (!visitor) throw new NotFoundException('Visitor not found.');
    const host = await this.prisma.user.findUnique({ where: { id: dto.hostId } });
    if (!host) throw new NotFoundException('Host not found.');

    const created = await this.prisma.overrideRequest.create({
      data: {
        visitorId: dto.visitorId,
        hostId: dto.hostId,
        requestedById: actorId,
        reason: dto.reason.trim(),
      },
      include: overrideInclude,
    });
    await this.audit.log({
      actorId,
      action: 'override.requested',
      targetType: 'override_request',
      targetId: created.id,
      meta: { visitorId: dto.visitorId, hostId: dto.hostId },
    });
    return this.toView(created);
  }

  async list(): Promise<OverrideRequestView[]> {
    const rows = await this.prisma.overrideRequest.findMany({
      include: overrideInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  approve(id: string, actorId: string): Promise<OverrideRequestView> {
    return this.resolve(id, OverrideStatus.approved, actorId);
  }

  deny(id: string, actorId: string): Promise<OverrideRequestView> {
    return this.resolve(id, OverrideStatus.denied, actorId);
  }

  /**
   * Validate an approved, unused override matches this visitor/host — for the
   * check-in flow. Throws if not approved, already consumed, or mismatched.
   */
  async getApprovedForCheckIn(
    id: string,
    visitorId: string,
    hostId: string,
  ): Promise<OverrideRequest> {
    const req = await this.prisma.overrideRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Override request not found.');
    if (req.status !== OverrideStatus.approved) {
      throw new UnprocessableEntityException('Override request is not approved.');
    }
    if (req.visitId) throw new ConflictException('This override has already been used.');
    if (req.visitorId !== visitorId || req.hostId !== hostId) {
      throw new ConflictException('Override does not match this visitor and host.');
    }
    return req;
  }

  /** Link an approved override to the visit it produced (one-time use). */
  markConsumed(id: string, visitId: string) {
    return this.prisma.overrideRequest.update({ where: { id }, data: { visitId } });
  }

  // --- helpers ---------------------------------------------------------------

  private async resolve(
    id: string,
    status: OverrideStatus,
    actorId: string,
  ): Promise<OverrideRequestView> {
    const existing = await this.prisma.overrideRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Override request not found.');
    if (existing.status !== OverrideStatus.pending) {
      throw new ConflictException('This request has already been resolved.');
    }

    const updated = await this.prisma.overrideRequest.update({
      where: { id },
      data: { status, resolvedById: actorId, resolvedAt: new Date() },
      include: overrideInclude,
    });
    await this.audit.log({
      actorId,
      action: status === OverrideStatus.approved ? 'override.approved' : 'override.denied',
      targetType: 'override_request',
      targetId: id,
    });
    return this.toView(updated);
  }

  private toView(o: OverrideWithRefs): OverrideRequestView {
    return {
      id: o.id,
      visitorName: o.visitor.fullName,
      hostName: o.host.fullName,
      requestedByName: o.requestedBy.fullName,
      reason: o.reason,
      requestedAt: o.createdAt.toISOString(),
      status: o.status,
      resolvedByName: o.resolvedBy?.fullName ?? null,
      resolvedAt: o.resolvedAt?.toISOString() ?? null,
    };
  }
}
