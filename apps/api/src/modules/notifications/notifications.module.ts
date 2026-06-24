import { Module } from '@nestjs/common';
import { PushModule } from '../../integrations/web-push/push.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Notifications module — the per-user in-app inbox (PRD §3 notifications) plus
 * Web Push subscription management. Rows are created by other flows (e.g.
 * arrival_alert on check-in); this module lists them and marks them read.
 */
@Module({
  imports: [PushModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
