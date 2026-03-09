import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ERRORS } from 'src/module/users/constants/errors';

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh') {
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false
  ): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          errorCode: Object.keys(ERRORS).find(
            (key) => ERRORS[key] === ERRORS.INVALID_REFRESH_TOKEN
          ),
          message: ERRORS.INVALID_REFRESH_TOKEN,
        })
      );
    }
    return user;
  }
}
