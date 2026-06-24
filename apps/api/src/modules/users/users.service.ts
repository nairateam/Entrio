import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Columns safe to return over the API — everything except passwordHash. */
export const userPublicSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  department: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: userPublicSelect });
  }

  findPublicByEmail(email: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({ where: { email }, select: userPublicSelect });
  }

  /** Full record incl. passwordHash — for the auth flow only, never returned to clients. */
  findByEmailWithSecret(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
