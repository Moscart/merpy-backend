import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { DAY_OF_WEEKS } from '../constants';

export const ScheduleDayResponseSchema = z.object({
  id: z.uuidv7(),
  scheduleId: z.uuidv7(),
  dayOfWeek: z.enum(DAY_OF_WEEKS),
  clockIn: z.date(),
  clockOut: z.date(),
});

export const ScheduleResponseSchema = z.object({
  id: z.uuidv7(),
  companyId: z.uuidv7(),
  name: z.string().min(2).max(100),
  scheduleDays: z.array(ScheduleDayResponseSchema),
});

export class ScheduleResponseDto extends createZodDto(ScheduleResponseSchema) {}
