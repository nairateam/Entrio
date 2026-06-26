import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Device } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/** Admin-facing view of a device (never includes the token hash). */
export interface DeviceView {
  id: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

const TOKEN_PREFIX = 'entrio_dev_';

/** sha256 hex of a token — deterministic, so we can look a device up by its token. */
const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * Self-service device credentials (PRD v2 §2.1). Tokens are high-entropy random
 * secrets shown to Admin exactly once at creation; only their sha256 is stored.
 */
@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(): Promise<DeviceView[]> {
    return this.prisma.device
      .findMany({ orderBy: { createdAt: 'desc' } })
      .then((rows) => rows.map(toView));
  }

  /** Create a device and return its plaintext token ONCE (never retrievable again). */
  async create(label: string, actorId: string): Promise<DeviceView & { apiToken: string }> {
    const apiToken = `${TOKEN_PREFIX}${randomBytes(32).toString('hex')}`;
    const device = await this.prisma.device.create({
      data: { label: label.trim(), apiTokenHash: hashToken(apiToken) },
    });
    await this.audit.log({
      actorId,
      action: 'device.created',
      targetType: 'device',
      targetId: device.id,
      meta: { label: device.label },
    });
    return { ...toView(device), apiToken };
  }

  /** Revoke a device (soft — keeps the row for audit/visibility). */
  async revoke(id: string, actorId: string): Promise<DeviceView> {
    const existing = await this.prisma.device.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Device not found.');

    const device = await this.prisma.device.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.log({
      actorId,
      action: 'device.revoked',
      targetType: 'device',
      targetId: id,
      meta: { label: device.label },
    });
    return toView(device);
  }

  /**
   * Resolve a device from its plaintext token. Returns null when the token is
   * unknown or the device is revoked. Touches `lastUsedAt` on a successful match.
   */
  async validateToken(token: string): Promise<Device | null> {
    if (!token) return null;
    const device = await this.prisma.device.findFirst({
      where: { apiTokenHash: hashToken(token), isActive: true },
    });
    if (!device) return null;
    // Best-effort usage stamp — never block the request on it.
    await this.prisma.device
      .update({ where: { id: device.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return device;
  }
}

function toView(device: Device): DeviceView {
  return {
    id: device.id,
    label: device.label,
    isActive: device.isActive,
    createdAt: device.createdAt.toISOString(),
    lastUsedAt: device.lastUsedAt?.toISOString() ?? null,
  };
}
