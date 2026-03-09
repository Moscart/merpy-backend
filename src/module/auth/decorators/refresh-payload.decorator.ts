import {
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ERRORS } from 'src/module/users/constants/errors';
import { JwtRefreshPayload } from '../types/jwt-payload.type';

export const RefreshPayload = createParamDecorator(
  (
    data: keyof JwtRefreshPayload | undefined,
    ctx: ExecutionContext
  ): JwtRefreshPayload | JwtRefreshPayload[keyof JwtRefreshPayload] => {
    const request = ctx
      .switchToHttp()
      .getRequest<Express.Request & { user: JwtRefreshPayload }>();

    const payload = request.user;

    if (!payload) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.REQUEST_PAYLOAD_NOT_FOUND
        ),
        message: ERRORS.REQUEST_PAYLOAD_NOT_FOUND,
      });
    }

    return data ? payload[data] : payload;
  }
);
