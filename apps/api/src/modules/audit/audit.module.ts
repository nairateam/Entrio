import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

/**
 * Audit module — global so any feature can inject AuditService without importing
 * this module (mirrors PrismaModule). PRD §7 requires audit coverage everywhere.
 * Also exposes the admin-only read endpoint (PRD §2.1).
 */
@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
