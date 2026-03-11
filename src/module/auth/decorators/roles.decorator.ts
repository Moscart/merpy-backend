import { SetMetadata } from '@nestjs/common';
import { USER_ROLES } from 'src/module/users/constants';

export const USER_ROLES_KEY = 'roles';
export const Roles = (...roles: (typeof USER_ROLES)[number][]) =>
  SetMetadata(USER_ROLES_KEY, roles);
