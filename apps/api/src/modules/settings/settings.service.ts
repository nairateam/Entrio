import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { UpdateSettingsDto } from './dto/update-settings.dto';

export interface SystemSettings {
  overstayThresholdHours: number;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly audit: AuditService) {}

  // In-memory: the PRD §3 data model has no settings table, so this resets on
  // restart. Move to a singleton row if persistence is needed.
  private settings: SystemSettings = {
    overstayThresholdHours: 4,
    pushNotifications: true,
    emailNotifications: true,
  };

  get(): SystemSettings {
    return { ...this.settings };
  }

  async update(next: UpdateSettingsDto, actorId: string): Promise<SystemSettings> {
    this.settings = {
      overstayThresholdHours: next.overstayThresholdHours,
      pushNotifications: next.pushNotifications,
      emailNotifications: next.emailNotifications,
    };
    await this.audit.log({
      actorId,
      action: 'settings.updated',
      targetType: 'settings',
      targetId: 'system',
      meta: { ...this.settings },
    });
    return this.get();
  }
}
