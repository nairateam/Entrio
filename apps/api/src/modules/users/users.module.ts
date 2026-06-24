import { Module } from '@nestjs/common';
import { EmailModule } from '../../integrations/email/email.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Users module — directory + lookups (PRD §2/§3) and admin user management.
 * PrismaModule + AuditModule are global, so the service injects them directly.
 */
@Module({
  imports: [EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
