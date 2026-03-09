import {
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ERRORS } from 'src/module/users/constants/errors';
import { AuthenticatedUser } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const request = ctx
      .switchToHttp()
      .getRequest<Express.Request & { user: AuthenticatedUser }>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.REQUEST_USER_NOT_FOUND
        ),
        message: ERRORS.REQUEST_USER_NOT_FOUND,
      });
    }

    return data ? user[data] : user;
  }
);
