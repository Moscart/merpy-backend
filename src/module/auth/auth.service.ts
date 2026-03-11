import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import { PinoLogger } from 'nestjs-pino';
import { CacheService } from 'src/common/cache/cache.service';
import { JwtConfig } from 'src/common/configs/jwt.config';
import { PrismaService } from 'src/common/database/prisma.service';
import { ERRORS } from '../../constants/errors';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register-company.dto';
import { JwtAccessPayload, JwtRefreshPayload } from './types/jwt-payload.type';
import { TokenResponse } from './types/token-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(AuthService.name);
  }

  async login(
    dto: LoginDto,
    userAgent: string,
    ipAddress: string
  ): Promise<TokenResponse> {
    const [username, companyCode] = dto.username.split('@');

    const user = await this.prismaService.users.findFirst({
      where: {
        username: username.toLowerCase(),
        company: {
          code: companyCode.toLowerCase(),
        },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.INVALID_CREDENTIALS
        ),
        message: ERRORS.INVALID_CREDENTIALS,
      });
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      dto.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.INVALID_CREDENTIALS
        ),
        message: ERRORS.INVALID_CREDENTIALS,
      });
    }

    const deviceId = crypto.randomUUID();

    const token = await this.generateTokens(
      user.id,
      user.companyId,
      user.username,
      user.email,
      deviceId
    );
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(token.refreshToken)
      .digest('hex');

    await this.prismaService.sessions.create({
      data: {
        userId: user.id,
        deviceId,
        refreshToken: refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await this.cacheService.set(
      `refresh_token:${user.id}:${deviceId}`,
      refreshTokenHash,
      7 * 24 * 60 * 60
    );

    return token;
  }

  async registerCompany(
    dto: RegisterDto,
    userAgent: string,
    ipAddress: string
  ) {
    const company = await this.prismaService.companies.findFirst({
      where: {
        code: dto.companyCode.toLowerCase(),
        deletedAt: null,
      },
    });

    if (company) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.COMPANY_ALREADY_EXISTS
        ),
        message: ERRORS.COMPANY_ALREADY_EXISTS,
      });
    }

    const registeredUser = await this.prismaService.users.create({
      data: {
        company: {
          create: {
            name: dto.companyName,
            code: dto.companyCode.toLowerCase(),
          },
        },
        fullName: dto.fullName,
        username: dto.username.toLowerCase(),
        email: dto.email.toLowerCase(),
        password: await bcrypt.hash(dto.password, 10),
        role: 'OWNER',
        isFlexible: true,
        status: 'ACTIVE',
        ownedCompanies: {
          connect: {
            code: dto.companyCode.toLowerCase(),
          },
        },
      },
    });

    const deviceId = crypto.randomUUID();

    const token = await this.generateTokens(
      registeredUser.id,
      registeredUser.companyId,
      registeredUser.username,
      registeredUser.email,
      deviceId
    );
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(token.refreshToken)
      .digest('hex');

    await this.prismaService.sessions.create({
      data: {
        userId: registeredUser.id,
        deviceId,
        refreshToken: refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await this.cacheService.set(
      `refresh_token:${registeredUser.id}:${deviceId}`,
      refreshTokenHash,
      7 * 24 * 60 * 60
    );

    return token;
  }

  async refresh(
    payload: JwtRefreshPayload,
    userAgent: string,
    ipAddress: string
  ): Promise<TokenResponse> {
    const deviceId = payload.deviceId;

    const token = await this.generateTokens(
      payload.sub,
      payload.companyId,
      payload.username,
      payload.email,
      deviceId
    );

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(token.refreshToken)
      .digest('hex');

    await this.prismaService.sessions.updateMany({
      where: {
        userId: payload.sub,
        deviceId: deviceId,
      },
      data: {
        refreshToken: refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await this.cacheService.set(
      `refresh_token:${payload.sub}:${deviceId}`,
      refreshTokenHash,
      7 * 24 * 60 * 60
    );

    return token;
  }

  private async generateTokens(
    userId: string,
    companyId: string,
    username: string,
    email: string,
    deviceId: string
  ): Promise<TokenResponse> {
    const accessTokenPayload: JwtAccessPayload = {
      sub: userId,
      type: 'access',
      companyId,
      username,
      email,
    };

    const refreshTokenPayload: JwtRefreshPayload = {
      sub: userId,
      type: 'refresh',
      companyId,
      username,
      email,
      deviceId: deviceId,
    };

    const jwtConfig = this.configService.get<JwtConfig>('jwt')!;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: jwtConfig.JWT_ACCESS_SECRET,
        expiresIn: jwtConfig.JWT_ACCESS_EXPIRES_IN as StringValue,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: jwtConfig.JWT_REFRESH_SECRET,
        expiresIn: jwtConfig.JWT_REFRESH_EXPIRES_IN as StringValue,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
