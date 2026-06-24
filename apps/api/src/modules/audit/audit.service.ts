import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntryInput {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Prisma.InputJsonValue;
}

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
}
