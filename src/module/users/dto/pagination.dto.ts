import { createZodDto } from 'nestjs-zod';
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from 'src/common/dto/pagination.dto';
import { SORT_ORDERS } from 'src/constants/pagination';
import {
  USER_ROLES,
  USER_SORT_BY,
  USER_STATUS,
} from 'src/module/users/constants';
import z from 'zod';
import { UserResponseSchema } from './user-response.dto';

export const UserQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(USER_SORT_BY).default('createdAt'),
  sortOrder: z.enum(SORT_ORDERS).default('desc'),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUS).optional(),
});

export const UserPaginationResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  meta: PaginationMetaSchema.extend({
    activeFilters: z.object({
      search: z.string().optional(),
      role: z.enum(USER_ROLES).optional(),
      status: z.enum(USER_STATUS).optional(),
    }),
    activeSort: z.object({
      sortBy: z.enum(USER_SORT_BY),
      sortOrder: z.enum(SORT_ORDERS),
    }),
  }),
});

export class UserQueryDto extends createZodDto(UserQuerySchema) {}

export class UserPaginationResponseDto extends createZodDto(
  UserPaginationResponseSchema
) {}
