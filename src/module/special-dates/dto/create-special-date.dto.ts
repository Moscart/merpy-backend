import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const CreateSpecialDateSchema = z
  .object({
    scheduleId: z.uuidv7().nullable().optional(),
    date: z.coerce.date(),
    name: z.string().trim().min(2).max(100),
    isOff: z.boolean().default(false),
    clockIn: z.string().regex(TIME_REGEX).nullable().optional(),
    clockOut: z.string().regex(TIME_REGEX).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasClockIn = data.clockIn !== null && data.clockIn !== undefined;
    const hasClockOut = data.clockOut !== null && data.clockOut !== undefined;

    if (data.isOff) {
      if (hasClockIn || hasClockOut) {
        ctx.addIssue({
          code: 'custom',
          message: 'clockIn and clockOut must be empty when isOff is true',
          path: ['clockIn'],
        });
      }
      return;
    }

    if (!hasClockIn || !hasClockOut) {
      ctx.addIssue({
        code: 'custom',
        message: 'clockIn and clockOut are required when isOff is false',
        path: ['clockIn'],
      });
    }
  });

export class CreateSpecialDateDto extends createZodDto(
  CreateSpecialDateSchema
) {}
