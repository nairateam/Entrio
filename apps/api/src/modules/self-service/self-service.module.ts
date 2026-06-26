import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { VisitsModule } from '../visits/visits.module';
import { VisitorsModule } from '../visitors/visitors.module';
import { SelfServiceController } from './self-service.controller';
import { SelfServiceService } from './self-service.service';

/**
 * Visitor self-service (PRD v2 §3). Imports DevicesModule for the device-token
 * guard, and reuses VisitsService/VisitorsService for gate-checks, visit
 * creation, and disambiguation search.
 */
@Module({
  imports: [DevicesModule, VisitsModule, VisitorsModule],
  controllers: [SelfServiceController],
  providers: [SelfServiceService],
})
export class SelfServiceModule {}
