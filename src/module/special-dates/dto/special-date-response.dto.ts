import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const SpecialDateResponseSchema = z.object({
  id: z.uuidv7(),
  companyId: z.uuidv7(),
  scheduleId: z.uuidv7().nullable(),
  date: z.date(),
  name: z.string().min(2).max(100),
  isOff: z.boolean(),
  clockIn: z.date().nullable(),
  clockOut: z.date().nullable(),
});

export class SpecialDateResponseDto extends createZodDto(
  SpecialDateResponseSchema
) {}
