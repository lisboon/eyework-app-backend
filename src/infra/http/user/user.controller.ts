import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { FindMeOutputDto } from '@/modules/users/usecase/find-me/find-me.usecase.dto';
import { LoginInput } from '@/modules/users/usecase/login/login.usecase.dto';
import { SignUpInput } from '@/modules/users/usecase/signup/signup.usecase.dto';
import { AuthGuard, type AuthenticatedUser } from '../auth/auth-guard';
import { REFRESH_RATE_LIMIT } from '../auth/rate-limit.config';
import { RateLimitGuard } from '../auth/rate-limit.guard';
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  sendSession,
} from '../auth/refresh-token.cookie';
import { CurrentUser } from '../shared/current-user.decorator';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('auth/signup')
  @UseGuards(RateLimitGuard)
  @SkipThrottle({ email: true })
  async signUp(
    @Body() body: SignUpInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { id, name, email, ...session } = await this.userService.signUp(body);
    return { id, name, email, ...sendSession(res, session) };
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async login(
    @Body() body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    return sendSession(res, await this.userService.login(body));
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @Throttle(REFRESH_RATE_LIMIT)
  @SkipThrottle({ email: true })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = readRefreshTokenCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return sendSession(res, await this.userService.refresh({ refreshToken }));
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = readRefreshTokenCookie(req);
    if (refreshToken) {
      await this.userService.logout({ refreshToken });
    }
    clearRefreshTokenCookie(res);
  }

  @Get('users/me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<FindMeOutputDto> {
    return this.userService.findMe({ id: user.id });
  }
}
