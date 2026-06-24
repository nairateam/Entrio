import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginated, type PageArgs, type Paginated } from '../../common/pagination';

export interface AuditEntryInput {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Prisma.InputJsonValue;
}

export interface AuditQuery {
  action?: string;
  from?: string;
  to?: string;
  search?: string;
}

/** Denormalized audit row for the viewer (matches the web AuditEntry shape). */
export interface AuditEntryView {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetLabel: string;
  detail: string | null;
  createdAt: string;
}

const auditInclude = {
  actor: { select: { fullName: true } },
} satisfies Prisma.AuditLogInclude;
type AuditRow = Prisma.AuditLogGetPayload<{ include: typeof auditInclude }>;

/**
 * Writes immutable audit_logs rows (PRD §3, §7 — 100% coverage of state-changing
 * actions). Inject into any service and call `log()` after a successful mutation.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditEntryInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        meta: entry.meta,
      },
    });
  }

  /**
   * Read the audit log for the admin viewer (PRD §2.1), newest first, paginated.
   * Search matches actor name, action, and target type/id at the DB level (the
   * meta-derived label/detail are display-only and not searched).
   */
  async query(filters: AuditQuery, args: PageArgs): Promise<Paginated<AuditEntryView>> {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);

    const q = filters.search?.trim();
    const where: Prisma.AuditLogWhereInput = {
      AND: [
        filters.action && filters.action !== 'all' ? { action: filters.action } : {},
        filters.from || filters.to ? { createdAt } : {},
        q
          ? {
              OR: [
                { actor: { fullName: { contains: q, mode: 'insensitive' } } },
                { action: { contains: q, mode: 'insensitive' } },
                { targetType: { contains: q, mode: 'insensitive' } },
                { targetId: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: auditInclude,
        orderBy: { createdAt: 'desc' },
        skip: args.skip,
        take: args.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginated(
      rows.map((r) => this.toView(r)),
      total,
      args,
    );
  }

  private toView(r: AuditRow): AuditEntryView {
    return {
      id: r.id,
      actorName: r.actor?.fullName ?? 'System',
      action: r.action,
      targetType: r.targetType,
      targetLabel: this.labelFrom(r),
      detail: this.detailFrom(r.meta),
      createdAt: r.createdAt.toISOString(),
    };
  }

  private labelFrom(r: AuditRow): string {
    const meta = r.meta;
    if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
      const m = meta as Record<string, unknown>;
      for (const key of ['visitorName', 'fullName', 'name']) {
        if (typeof m[key] === 'string') return m[key] as string;
      }
    }
    return r.targetId;
  }

  private detailFrom(meta: Prisma.JsonValue | null): string | null {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
    const parts = Object.entries(meta as Record<string, unknown>)
      .filter(([, v]) => v !== null && typeof v !== 'object')
      .map(([k, v]) => `${k}: ${String(v)}`);
    return parts.length ? parts.join(' · ') : null;
  }
}
