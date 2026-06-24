import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { toUserRole } from '../../common/mappers/role.mapper';
import { UsersService, type PublicUser } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** Verify credentials with argon2; throws 401 on any mismatch (no user enumeration). */
  async validateCredentials(email: string, password: string): Promise<PublicUser> {
    const user = await this.users.findByEmailWithSecret(email);
    const invalid = new UnauthorizedException('Invalid email or password.');
    if (!user || !user.isActive) throw invalid;

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw invalid;

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; accessToken: string }> {
    const user = await this.validateCredentials(dto.email, dto.password);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: toUserRole(user.role),
    };
    const accessToken = await this.jwt.signAsync(payload);
    return { user, accessToken };
  }
}
