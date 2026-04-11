import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { CreateScheduleSchema } from './create-schedule.dto';

export const UpdateScheduleSchema = CreateScheduleSchema.partial().strict();

export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

export class UpdateScheduleDto extends createZodDto(UpdateScheduleSchema) {}
