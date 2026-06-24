import { Module } from '@nestjs/common';
import { OverridesController } from './overrides.controller';
import { OverridesService } from './overrides.service';

/**
 * Overrides module — working-hours override request/approval queue (PRD §4.8).
 * Exports the service so VisitsService can consume an approved override at
 * check-in.
 */
@Module({
  controllers: [OverridesController],
  providers: [OverridesService],
  exports: [OverridesService],
})
export class OverridesModule {}
