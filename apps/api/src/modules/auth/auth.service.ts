import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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

    // Strip secrets — never expose the password hash or the set-password token.
    const {
      passwordHash: _passwordHash,
      passwordTokenHash: _passwordTokenHash,
      passwordTokenExpiresAt: _passwordTokenExpiresAt,
      ...publicUser
    } = user;
    return publicUser;
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; accessToken: string }> {
    const user = await this.validateCredentials(dto.email, dto.password);
    return this.issueSession(user);
  }

  /** Check a set-password token and return the target email (for the set-password page). */
  async validatePasswordToken(token: string): Promise<{ email: string }> {
    const user = await this.requireValidToken(token);
    return { email: user.email };
  }

  /** Set the user's password via a valid token, then log them in. */
  async setPassword(token: string, password: string): Promise<{ user: PublicUser; accessToken: string }> {
    const user = await this.requireValidToken(token);
    const passwordHash = await argon2.hash(password);
    const publicUser = await this.users.completePasswordSet(user.id, passwordHash);
    return this.issueSession(publicUser);
  }

  private async requireValidToken(token: string) {
    const invalid = new BadRequestException('This link is invalid or has expired.');
    if (!token) throw invalid;
    const user = await this.users.findByPasswordToken(token);
    if (!user || !user.passwordTokenExpiresAt || user.passwordTokenExpiresAt.getTime() < Date.now()) {
      throw invalid;
    }
    return user;
  }

  private async issueSession(user: PublicUser): Promise<{ user: PublicUser; accessToken: string }> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: toUserRole(user.role) };
    const accessToken = await this.jwt.signAsync(payload);
    return { user, accessToken };
  }
}
