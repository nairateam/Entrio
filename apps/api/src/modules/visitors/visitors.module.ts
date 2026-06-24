import { Module } from '@nestjs/common';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';

/**
 * Visitors module — search/create/flag + the blocklist/restriction security
 * check (PRD §4.7/§4.11/§4.12/§4.13). Exports the service for VisitsModule.
 */
@Module({
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
