import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ZodSerializerDto } from 'nestjs-zod';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshPayload } from './decorators/refresh-payload.decorator';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me.dto';
import { RegisterDto } from './dto/register-company.dto';
import { RefreshAuthGuard } from './guards/refresh-auth-guard';
import type {
  AuthenticatedUser,
  JwtRefreshPayload,
} from './types/jwt-payload.type';
import { TokenResponse } from './types/token-response.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string
  ): Promise<TokenResponse> {
    const token = await this.authService.login(dto, userAgent, ipAddress);

    res.cookie('access_token', token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
  }

  @Public()
  @Post('register/company')
  @HttpCode(HttpStatus.OK)
  async registerCompany(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string
  ): Promise<TokenResponse> {
    const token = await this.authService.registerCompany(
      dto,
      userAgent,
      ipAddress
    );

    res.cookie('access_token', token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @RefreshPayload() payload: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string
  ): Promise<TokenResponse> {
    const token = await this.authService.refresh(payload, userAgent, ipAddress);

    res.cookie('access_token', token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
  }

  @Get('me')
  @ZodSerializerDto(MeResponseDto)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    const currentUser = await this.usersService.findOne(
      user.companyId,
      user.id
    );
    return currentUser;
  }
}
