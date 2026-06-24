import { Module } from '@nestjs/common';
import { PushModule } from '../../integrations/web-push/push.module';
import { HostsController } from './hosts.controller';
import { HostsService } from './hosts.service';

/**
 * Hosts module — host-scoped pre-registration (§4.4), "On My Way" + replies to
 * the front desk (§4.5), and personal visitor restrictions (§4.11). Restrictions
 * feed the check-in security check in VisitorsService.
 */
@Module({
  imports: [PushModule],
  controllers: [HostsController],
  providers: [HostsService],
  exports: [HostsService],
})
export class HostsModule {}
