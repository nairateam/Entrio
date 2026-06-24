import { Module } from '@nestjs/common';
import { WorkingHoursController } from './working-hours.controller';
import { WorkingHoursService } from './working-hours.service';

/**
 * Working-hours module — CRUD for working_hours + blackout_dates (PRD §3) and
 * the shared `isOpenAt` gate (PRD §4.8). Exports the service so VisitsService
 * can reuse the gate at check-in.
 */
@Module({
  controllers: [WorkingHoursController],
  providers: [WorkingHoursService],
  exports: [WorkingHoursService],
})
export class WorkingHoursModule {}
