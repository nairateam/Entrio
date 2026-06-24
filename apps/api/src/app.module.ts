import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { VisitsModule } from './modules/visits/visits.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { HostsModule } from './modules/hosts/hosts.module';
import { WorkingHoursModule } from './modules/working-hours/working-hours.module';
import { OverridesModule } from './modules/overrides/overrides.module';
import { BlocklistModule } from './modules/blocklist/blocklist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    VisitorsModule,
    VisitsModule,
    DepartmentsModule,
    HostsModule,
    WorkingHoursModule,
    OverridesModule,
    BlocklistModule,
    NotificationsModule,
    ReportsModule,
    SettingsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
