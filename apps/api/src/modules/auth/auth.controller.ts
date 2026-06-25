import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 1 day

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    // In production the web (Vercel) and API (Railway) are on different sites, so
    // the auth cookie must be SameSite=None + Secure to ride cross-site requests.
    // Locally (same host, http) keep Lax so it works without HTTPS.
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken } = await this.auth.login(dto);
    res.cookie(COOKIE_NAME, accessToken, this.cookieOptions());
    return { user };
  }

  /** Validate an invite/reset token (for the set-password page to greet the user). */
  @Get('set-password')
  @HttpCode(200)
  validateSetPassword(@Query('token') token?: string) {
    return this.auth.validatePasswordToken(token ?? '');
  }

  /** Set a password via a valid token and start the session. */
  @Post('set-password')
  @HttpCode(200)
  async setPassword(@Body() dto: SetPasswordDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken } = await this.auth.setPassword(dto.token, dto.password);
    res.cookie(COOKIE_NAME, accessToken, this.cookieOptions());
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear with the same attributes the cookie was set with, or the browser
    // won't match/remove it (SameSite=None; Secure in production).
    const { maxAge: _maxAge, ...clearOptions } = this.cookieOptions();
    res.clearCookie(COOKIE_NAME, clearOptions);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    return { user: await this.users.findById(user.id) };
  }
}
