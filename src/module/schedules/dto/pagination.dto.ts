import { createZodDto } from 'nestjs-zod';
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from 'src/common/dto/pagination.dto';
import { SORT_ORDERS } from 'src/constants/pagination';
import { SCHEDULE_SORT_BY } from 'src/module/schedules/constants';
import z from 'zod';
import { ScheduleResponseSchema } from './schedule-response.dto';

export const ScheduleQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(SCHEDULE_SORT_BY).default('name'),
  sortOrder: z.enum(SORT_ORDERS).default('asc'),
});

export const SchedulePaginationResponseSchema = z.object({
  data: z.array(ScheduleResponseSchema),
  meta: PaginationMetaSchema.extend({
    activeFilters: z.object({
      search: z.string().optional(),
    }),
    activeSort: z.object({
      sortBy: z.enum(SCHEDULE_SORT_BY),
      sortOrder: z.enum(SORT_ORDERS),
    }),
  }),
});

export class ScheduleQueryDto extends createZodDto(ScheduleQuerySchema) {}

export class SchedulePaginationResponseDto extends createZodDto(
  SchedulePaginationResponseSchema
) {}
