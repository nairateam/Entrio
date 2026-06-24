import { Module } from '@nestjs/common';
import { BlocklistController } from './blocklist.controller';
import { BlocklistService } from './blocklist.service';

/**
 * Blocklist module — admin block/unblock + flagged-visitor management
 * (PRD §4.7/§4.12). Blocks are enforced at check-in by VisitsService.
 */
@Module({
  controllers: [BlocklistController],
  providers: [BlocklistService],
  exports: [BlocklistService],
})
export class BlocklistModule {}
