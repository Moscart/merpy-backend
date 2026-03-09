import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { CacheService } from 'src/common/cache/cache.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { ROLES } from 'src/constants';
import { ERRORS } from 'src/module/users/constants/errors';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      (typeof ROLES)[number][]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    const user = request.user;

    if (!user || !user.id || !user.companyId) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.REQUEST_USER_NOT_FOUND
        ),
        message: ERRORS.REQUEST_USER_NOT_FOUND,
      });
    }

    const cacheKey = `user:${user.companyId}:${user.id}:role`;
    let userRole = await this.cacheService.get(cacheKey);

    this.logger.debug(`${userRole}`);

    if (!userRole) {
      const dbUser = await this.prismaService.users.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!dbUser) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.USER_NOT_FOUND
          ),
          message: ERRORS.USER_NOT_FOUND,
        });
      }

      userRole = dbUser.role;
      // Cache role for a certain period, e.g., 1 hour
      await this.cacheService.set(cacheKey, userRole, 3600);
    }

    const hasRole = requiredRoles.some(
      (role) => userRole === role || userRole?.includes(role)
    );

    if (!hasRole) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.UNAUTHORIZED
        ),
        message: ERRORS.UNAUTHORIZED,
      });
    }

    return true;
  }
}
