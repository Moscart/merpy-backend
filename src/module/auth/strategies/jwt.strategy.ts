import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from 'src/common/configs/jwt.config';
import { ERRORS } from 'src/module/users/constants/errors';
import { AuthenticatedUser, JwtAccessPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token as string;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<JwtConfig>('jwt')!.JWT_ACCESS_SECRET,
    });
  }

  validate(payload: JwtAccessPayload): AuthenticatedUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorCode: Object.keys(ERRORS).find(
          (key) => ERRORS[key] === ERRORS.INVALID_TOKEN_TYPE
        ),
        message: ERRORS.INVALID_TOKEN_TYPE,
      });
    }

    return {
      id: payload.sub,
      companyId: payload.companyId,
      username: payload.username,
      email: payload.email,
    };
  }
}
