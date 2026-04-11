import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { DAY_OF_WEEKS } from '../constants';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const ScheduleDayInputSchema = z.object({
  dayOfWeek: z.enum(DAY_OF_WEEKS),
  clockIn: z.string().regex(TIME_REGEX),
  clockOut: z.string().regex(TIME_REGEX),
});

export const CreateScheduleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  scheduleDays: z
    .array(ScheduleDayInputSchema)
    .min(1)
    .superRefine((scheduleDays, ctx) => {
      const daySet = new Set<string>();

      scheduleDays.forEach((scheduleDay, index) => {
        if (daySet.has(scheduleDay.dayOfWeek)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Duplicate dayOfWeek in scheduleDays is not allowed',
            path: [index, 'dayOfWeek'],
          });
          return;
        }

        daySet.add(scheduleDay.dayOfWeek);
      });
    }),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type ScheduleDayInput = CreateScheduleInput['scheduleDays'][number];

export class CreateScheduleDto extends createZodDto(CreateScheduleSchema) {}
