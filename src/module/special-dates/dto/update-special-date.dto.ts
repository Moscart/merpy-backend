import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const UpdateSpecialDateSchema = z
  .object({
    scheduleId: z.uuidv7().nullable().optional(),
    date: z.coerce.date().optional(),
    name: z.string().trim().min(2).max(100).optional(),
    isOff: z.boolean().optional(),
    clockIn: z.string().regex(TIME_REGEX).nullable().optional(),
    clockOut: z.string().regex(TIME_REGEX).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.clockIn !== undefined && data.clockOut === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'clockOut must be provided when clockIn is provided',
        path: ['clockOut'],
      });
    }

    if (data.clockOut !== undefined && data.clockIn === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'clockIn must be provided when clockOut is provided',
        path: ['clockIn'],
      });
    }

    if (
      data.isOff === true &&
      ((data.clockIn !== undefined && data.clockIn !== null) ||
        (data.clockOut !== undefined && data.clockOut !== null))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'clockIn and clockOut must be empty when isOff is true',
        path: ['clockIn'],
      });
    }
  });

export class UpdateSpecialDateDto extends createZodDto(
  UpdateSpecialDateSchema
) {}
