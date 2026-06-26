import { Injectable, OnModuleInit } from '@nestjs/common';
import type { SystemSetting } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { UpdateSettingsDto } from './dto/update-settings.dto';

export interface SystemSettings {
  overstayThresholdHours: number;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

const SETTINGS_ID = 'system';
const DEFAULTS: SystemSettings = {
  overstayThresholdHours: 4,
  pushNotifications: true,
  emailNotifications: true,
};

/**
 * System settings (PRD §4.6). Persisted in a single `system_settings` row but
 * cached in memory so `get()` stays synchronous (it's called on hot paths like
 * check-in). The cache is hydrated from the DB on boot and write-through on update.
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private settings: SystemSettings = { ...DEFAULTS };

  async onModuleInit(): Promise<void> {
    const row = await this.prisma.systemSetting.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID, ...DEFAULTS },
    });
    this.settings = toSettings(row);
  }

  get(): SystemSettings {
    return { ...this.settings };
  }

  async update(next: UpdateSettingsDto, actorId: string): Promise<SystemSettings> {
    const data = {
      overstayThresholdHours: next.overstayThresholdHours,
      pushNotifications: next.pushNotifications,
      emailNotifications: next.emailNotifications,
    };
    const row = await this.prisma.systemSetting.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });
    this.settings = toSettings(row);
    await this.audit.log({
      actorId,
      action: 'settings.updated',
      targetType: 'settings',
      targetId: SETTINGS_ID,
      meta: { ...this.settings },
    });
    return this.get();
  }
}

function toSettings(row: SystemSetting): SystemSettings {
  return {
    overstayThresholdHours: row.overstayThresholdHours,
    pushNotifications: row.pushNotifications,
    emailNotifications: row.emailNotifications,
  };
}
