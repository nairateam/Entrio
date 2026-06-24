import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Non-fatal: Prisma also connects lazily on first query, so the API still
    // boots cleanly before a database is provisioned.
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(`Database not reachable yet — continuing without a connection. ${error}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
