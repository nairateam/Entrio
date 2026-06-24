import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Audit module — global so any feature can inject AuditService without importing
 * this module (mirrors PrismaModule). PRD §7 requires audit coverage everywhere.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
