import { createZodDto } from 'nestjs-zod';
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from 'src/common/dto/pagination.dto';
import { SORT_ORDERS } from 'src/constants/pagination';
import { OFFICE_SORT_BY } from 'src/module/offices/constants';
import z from 'zod';
import { OfficeResponseSchema } from './office-response.dto';

export const OfficeQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(OFFICE_SORT_BY).default('createdAt'),
  sortOrder: z.enum(SORT_ORDERS).default('desc'),
  isActive: z.enum(['true', 'false']).optional(),
});

export const OfficePaginationResponseSchema = z.object({
  data: z.array(OfficeResponseSchema),
  meta: PaginationMetaSchema.extend({
    activeFilters: z.object({
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    activeSort: z.object({
      sortBy: z.enum(OFFICE_SORT_BY),
      sortOrder: z.enum(SORT_ORDERS),
    }),
  }),
});

export class OfficeQueryDto extends createZodDto(OfficeQuerySchema) {}

export class OfficePaginationResponseDto extends createZodDto(
  OfficePaginationResponseSchema
) {}
