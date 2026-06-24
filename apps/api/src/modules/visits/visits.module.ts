import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../integrations/cloudinary/cloudinary.module';
import { PushModule } from '../../integrations/web-push/push.module';
import { OverridesModule } from '../overrides/overrides.module';
import { SettingsModule } from '../settings/settings.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { WorkingHoursModule } from '../working-hours/working-hours.module';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

/**
 * Visits module — check-in/out + today's board (PRD §4.1/§4.3/§4.10). Imports
 * VisitorsModule (blocklist/restriction check), WorkingHoursModule (the §4.8
 * gate), and OverridesModule (consume an approved override at check-in).
 */
@Module({
  imports: [
    VisitorsModule,
    WorkingHoursModule,
    OverridesModule,
    CloudinaryModule,
    PushModule,
    SettingsModule,
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
