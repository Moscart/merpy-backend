import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(50),
  description: z.string().trim().max(255).nullable().optional(),
  managerId: z.uuidv7(),
});

export class CreateDepartmentDto extends createZodDto(CreateDepartmentSchema) {}
