import { createZodDto } from 'nestjs-zod';
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from 'src/common/dto/pagination.dto';
import { SORT_ORDERS } from 'src/constants/pagination';
import { SPECIAL_DATE_SORT_BY } from 'src/module/special-dates/constants';
import z from 'zod';
import { SpecialDateResponseSchema } from './special-date-response.dto';

export const SpecialDateQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(SPECIAL_DATE_SORT_BY).default('date'),
  sortOrder: z.enum(SORT_ORDERS).default('desc'),
  isOff: z.enum(['true', 'false']).optional(),
});

export const SpecialDatePaginationResponseSchema = z.object({
  data: z.array(SpecialDateResponseSchema),
  meta: PaginationMetaSchema.extend({
    activeFilters: z.object({
      search: z.string().optional(),
      isOff: z.boolean().optional(),
    }),
    activeSort: z.object({
      sortBy: z.enum(SPECIAL_DATE_SORT_BY),
      sortOrder: z.enum(SORT_ORDERS),
    }),
  }),
});

export class SpecialDateQueryDto extends createZodDto(SpecialDateQuerySchema) {}

export class SpecialDatePaginationResponseDto extends createZodDto(
  SpecialDatePaginationResponseSchema
) {}
