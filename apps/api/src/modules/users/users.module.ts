import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * Users module — directory + lookups (PRD §2/§3). PrismaModule is global, so
 * UsersService injects PrismaService directly.
 */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
