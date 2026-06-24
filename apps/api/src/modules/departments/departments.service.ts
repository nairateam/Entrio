import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Department } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/** Admin-managed department pick-list (drives the department dropdowns). */
@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(): Promise<Department[]> {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async create(name: string, actorId: string): Promise<Department> {
    const trimmed = name.trim();
    const existing = await this.prisma.department.findUnique({ where: { name: trimmed } });
    if (existing) throw new ConflictException('That department already exists.');

    const department = await this.prisma.department.create({ data: { name: trimmed } });
    await this.audit.log({
      actorId,
      action: 'department.created',
      targetType: 'department',
      targetId: department.id,
      meta: { name: trimmed },
    });
    return department;
  }

  async remove(id: string, actorId: string): Promise<{ id: string }> {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('Department not found.');

    await this.prisma.department.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'department.deleted',
      targetType: 'department',
      targetId: id,
      meta: { name: department.name },
    });
    return { id };
  }
}
