import { createZodDto } from 'nestjs-zod';
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from 'src/common/dto/pagination.dto';
import { SORT_ORDERS } from 'src/constants/pagination';
import { DEPARTMENT_SORT_BY } from 'src/module/departments/constants';
import z from 'zod';
import { DepartmentResponseSchema } from './department-response.dto';

export const DepartmentQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(DEPARTMENT_SORT_BY).default('createdAt'),
  sortOrder: z.enum(SORT_ORDERS).default('desc'),
});

export const DepartmentPaginationResponseSchema = z.object({
  data: z.array(DepartmentResponseSchema),
  meta: PaginationMetaSchema.extend({
    activeFilters: z.object({
      search: z.string().optional(),
    }),
    activeSort: z.object({
      sortBy: z.enum(DEPARTMENT_SORT_BY),
      sortOrder: z.enum(SORT_ORDERS),
    }),
  }),
});

export class DepartmentQueryDto extends createZodDto(DepartmentQuerySchema) {}

export class DepartmentPaginationResponseDto extends createZodDto(
  DepartmentPaginationResponseSchema
) {}
