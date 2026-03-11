import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as crypto from 'crypto';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CacheService } from 'src/common/cache/cache.service';
import { JwtConfig } from 'src/common/configs/jwt.config';
import { PrismaService } from 'src/common/database/prisma.service';
import { ERRORS } from 'src/constants/errors';
import { SessionsService } from 'src/module/sessions/sessions.service';
import { JwtRefreshPayload } from '../types/jwt-payload.type';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly sessionsService: SessionsService,
    private readonly logger: PinoLogger
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token as string;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<JwtConfig>('jwt')!.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtRefreshPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.INVALID_TOKEN_TYPE
        ),
        message: ERRORS.INVALID_TOKEN_TYPE,
      });
    }

    const redisKey = `refresh_token:${payload.sub}:`;
    const refreshToken = request.cookies['refresh_token'] as string;

    const cachedSession = await this.cacheService.get(
      redisKey + payload.deviceId
    );

    if (cachedSession) {
      const compareCacheResult = this.hashToken(refreshToken) === cachedSession;

      if (compareCacheResult) return payload;
    }

    const user = await this.prismaService.users.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.USER_NOT_FOUND
        ),
        message: ERRORS.USER_NOT_FOUND,
      });
    }

    const session = await this.prismaService.sessions.findFirst({
      where: {
        userId: payload.sub,
        deviceId: payload.deviceId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.SESSION_NOT_FOUND
        ),
        message: ERRORS.SESSION_NOT_FOUND,
      });
    }

    const compareResult = this.hashToken(refreshToken) === session.refreshToken;

    if (!compareResult) {
      await this.sessionsService.revokeAllByUserId(payload.sub);
      await this.cacheService.deleteKeysByPattern(
        `refresh_token:${payload.sub}:*`
      );
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.INVALID_REFRESH_TOKEN
        ),
        message: ERRORS.INVALID_REFRESH_TOKEN,
      });
    }

    await this.cacheService.set(
      redisKey + payload.deviceId,
      session.refreshToken,
      7 * 24 * 60 * 60
    );

    return payload;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
